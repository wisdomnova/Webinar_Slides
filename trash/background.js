function convertDocToSlides(url) {
    // Extract the doc ID from the URL using regular expression
    const docIdMatch = url.match(/\/d\/([^\/]+)\/edit/);
    let docId;
    if (docIdMatch) {
      docId = docIdMatch[1];
    } else {
      console.error('Failed to extract doc ID from URL');
      return;
    }
  
    // Authenticate using Chrome Identity API
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError) {
        console.error('Error obtaining auth token:', chrome.runtime.lastError.message);
        return;
      }
  
      // Convert the doc to slides with the extracted ID
      convertDocToSlidesWithId(docId, token);
    });
  }
  
  async function convertDocToSlidesWithId(documentId, token) {
    try {
      // Retrieve the contents of the Google Doc
      const docResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!docResponse.ok) {
        throw new Error(`Failed to fetch document: ${docResponse.statusText}`);
      }
  
      const docContent = await docResponse.json();
  
      // Extract page width and height from the document style in JSON
      const pageWidth = docContent.documentStyle.pageSize.width.magnitude;  // Page width
      const pageHeight = docContent.documentStyle.pageSize.height.magnitude / 2;  // Half the page height
      const docTitle = docContent.title || 'Untitled Presentation';  // Extract the document title or set a default title
  
      // Create a new Google Slides presentation with the title from the Google Doc
      const presentationResponse = await fetch('https://slides.googleapis.com/v1/presentations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Converted from Google Doc - ${docTitle}`,
        }),
      });
  
      if (!presentationResponse.ok) {
        throw new Error(`Failed to create presentation: ${presentationResponse.statusText}`);
      }
  
      const presentationData = await presentationResponse.json();
      const presentationId = presentationData.presentationId;
  
      // Initialize slide creation requests
      const requests = [];
  
      // Extract content and styles from the document
      docContent.body.content.forEach((element) => {
        if (element.paragraph) {
          handleParagraphElement(element, requests, pageWidth, pageHeight, docContent.lists);
        }
      });
  
      // Handle images from the inlineObjects
      handleInlineImages(docContent.inlineObjects, requests, pageWidth, pageHeight);
  
      // Send batch update to create slides and content
      if (requests.length > 0) {
        const updateResponse = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests }),
        });
  
        if (!updateResponse.ok) {
          throw new Error(`Failed to update slides: ${updateResponse.statusText}`);
        }
      }
  
      // Open the presentation in a new tab after all updates are completed
      chrome.tabs.create({ url: `https://docs.google.com/presentation/d/${presentationId}/edit` });
  
      console.log('Conversion completed successfully!');
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  function handleParagraphElement(element, requests, pageWidth, pageHeight, lists) {
    // Extract text content and properties from the paragraph elements
    const textContent = element.paragraph.elements
      .map(el => el.textRun?.content || '')
      .join('')
      .trim();  // Trim to remove only whitespace or newline
  
    if (!textContent) {
      // Skip if the text is empty or just new lines
      return;
    }
  
    const isListItem = element.paragraph.bullet !== undefined;
    const listId = element.paragraph.bullet?.listId;
    const list = lists && lists[listId];
  
    // Get text style and alignment
    const textStyle = element.paragraph.elements[0].textRun.textStyle || {};
    const paragraphStyle = element.paragraph.paragraphStyle || {};
    const fontSize = textStyle.fontSize ? textStyle.fontSize.magnitude : 12;
    const alignment = paragraphStyle.alignment || 'START';
  
    // Create a new blank slide
    const slideId = `slide_${requests.length + 1}`;
  
    requests.push({
      createSlide: {
        objectId: slideId,
        slideLayoutReference: {
          predefinedLayout: 'BLANK', // Use blank layout to ensure no default title or subtitle
        },
      },
    });
  
    const objectId = `textbox_${requests.length}`;
  
    // Center the shape on the slide
    requests.push({
      createShape: {
        objectId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            height: {
              magnitude: pageHeight, // Use half the page height
              unit: 'PT',
            },
            width: {
              magnitude: pageWidth, // Use the extracted page width from JSON
              unit: 'PT',
            },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: (pageWidth / 12), // Center horizontally
            translateY: 5,
            unit: 'PT',
          },
        },
      },
    });
  
    // Insert text or bullet points into the shape
    requests.push({
      insertText: {
        objectId,
        text: textContent,
      },
    });
  
    // Apply text style (font size, color, alignment)
    requests.push({
      updateTextStyle: {
        objectId,
        style: {
          fontSize: {
            magnitude: fontSize,
            unit: 'PT',
          },
          foregroundColor: {
            opaqueColor: {
              rgbColor: textStyle.foregroundColor?.color?.rgbColor || { red: 0, green: 0, blue: 0 }, // Default to black
            },
          },
        },
        fields: 'fontSize,foregroundColor',
      },
    });
  
    // Apply alignment
    requests.push({
      updateParagraphStyle: {
        objectId,
        style: {
          alignment: alignment.toUpperCase(),
        },
        textRange: {
          type: 'ALL',
        },
        fields: 'alignment',
      },
    });
  
    // Apply bullet or numbered list formatting if applicable
    if (isListItem) {
      const bulletPreset = list?.listProperties?.nestingLevels[0]?.glyphType === 'NUMBER' 
                            ? 'NUMBERED_DECIMAL' 
                            : 'BULLET_DISC_CIRCLE_SQUARE';
  
      requests.push({
        createParagraphBullets: {
          objectId,
          textRange: {
            type: 'ALL',
          },
          bulletPreset: bulletPreset,
        },
      });
    }
  }
  
  function handleInlineImages(inlineObjects, requests, pageWidth, pageHeight) {
    for (const [objectId, inlineObject] of Object.entries(inlineObjects)) {
      const embeddedObject = inlineObject.inlineObjectProperties.embeddedObject;
  
      if (embeddedObject && embeddedObject.imageProperties) {
        // Extract image details
        const imageUrl = embeddedObject.imageProperties.contentUri;
        const imageHeight = embeddedObject.size.height.magnitude; // Use exact height
        const imageWidth = embeddedObject.size.width.magnitude; // Use exact width
        const positionX = (pageWidth - imageWidth); // Center horizontally
        const positionY = embeddedObject.marginTop.magnitude || 0; // Use top margin as specified
  
        // Each image goes to a new blank slide
        const slideId = `slide_${requests.length + 1}`;
  
        requests.push({
          createSlide: {
            objectId: slideId,
            slideLayoutReference: {
              predefinedLayout: 'BLANK', // Use blank layout to ensure no default title or subtitle
            },
          },
        });
  
        const imageObjectId = `image_${requests.length}`;
  
        requests.push({
          createImage: {
            objectId: imageObjectId,
            url: imageUrl,
            elementProperties: {
              pageObjectId: slideId,
              size: {
                height: {
                  magnitude: imageHeight, // Use original height
                  unit: 'PT',
                },
                width: {
                  magnitude: imageWidth, // Use original width
                  unit: 'PT',
                },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: positionX, // Centered horizontally
                translateY: positionY,
                unit: 'PT',
              },
            },
          },
        });
      }
    }
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'createPresentation') {
      convertDocToSlides(message.texts);
      sendResponse({ status: 'Processing started' });
      return true;  // Keeps the message channel open for asynchronous response
    }
  });

chrome.action.onClicked.addListener(function(tab) {
  console.log('Clicked');
  convertDocToSlides(message.texts);
});