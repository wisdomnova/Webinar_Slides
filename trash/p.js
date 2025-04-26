var isComplete = false;
// Track the cumulative height for each slide
let slideHeights = {};

// Reset the cumulative height counter for each new slide
function resetSlideHeight(slideId) {
  slideHeights[slideId] = 0;
}

// Get the current height and update with new shape's height
function updateSlideHeight(slideId, shapeHeight) {
  if (!(slideId in slideHeights)) {
    slideHeights[slideId] = 0;
  }
  const currentHeight = slideHeights[slideId];
  slideHeights[slideId] += shapeHeight + 20; // Add spacing between shapes
  return currentHeight; // Return the height before adding the new shape
}

function handleParagraphElement(element, requests, pageWidth, pageHeight, slideId) {
  const textRuns = element.paragraph.elements.map(el => el.textRun).filter(tr => tr && tr.content.trim() !== '' && tr.content !== '\n');

  textRuns.forEach((textRun, index) => {
    const lines = Math.ceil(textRun.content.split(' ').length / 4); // Estimate lines
    const lineHeight = 20 * 1.2; // Estimate line height
    const shapeHeight = lineHeight * lines; // Calculate shape height

    const translateY = updateSlideHeight(slideId, shapeHeight);
    const objectId = `textbox_${requests.length}`;

    requests.push({
      createShape: {
        objectId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            height: {
              magnitude: shapeHeight,
              unit: 'PT',
            },
            width: {
              magnitude: pageWidth + (pageWidth / 6),
              unit: 'PT',
            },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 2,
            translateY: translateY,
            unit: 'PT',
          },
        },
      },
    });

    requests.push({
      insertText: {
        objectId,
        text: textRun.content.trim(), // Insert trimmed content
      },
    });

    const { bold, underline, link, foregroundColor, fontSize, weightedFontFamily } = textRun.textStyle;

    const style = {
      underline: underline || false,
      bold: bold || false,
      link: link || {},
      fontSize: {
        magnitude: 20,
        unit: 'PT',
      },
      foregroundColor: {
        opaqueColor: {
          rgbColor: foregroundColor?.color?.rgbColor || { red: 0, green: 0, blue: 0 },
        },
      },
      weightedFontFamily: {
        fontFamily: weightedFontFamily?.fontFamily || 'Arial',
        weight: weightedFontFamily?.weight || 400,
      },
    };

    requests.push({
      updateTextStyle: {
        objectId,
        style: style,
        textRange: {
          type: 'FIXED_RANGE',
          startIndex: 0,
          endIndex: textRun.content.length,
        },
        fields: 'fontSize,foregroundColor,bold',
      },
    });

    requests.push({
      updateParagraphStyle: {
        objectId,
        style: {
          alignment: 'CENTER',
        },
        textRange: {
          type: 'ALL',
        },
        fields: 'alignment',
      },
    });
  });
}

function handleInlineImages(inlineObjects, requests, pageWidth, pageHeight) {
  if (inlineObjects !== undefined) {
    for (const [objectId, inlineObject] of Object.entries(inlineObjects)) {
      const embeddedObject = inlineObject.inlineObjectProperties.embeddedObject;

      if (embeddedObject && embeddedObject.imageProperties) {
        const imageUrl = embeddedObject.imageProperties.contentUri;
        const imageHeight = embeddedObject.size.height.magnitude;
        const imageWidth = embeddedObject.size.width.magnitude;

        const slideId = `slide_${requests.length + 1}`;

        requests.push({
          createSlide: {
            objectId: slideId,
            slideLayoutReference: {
              predefinedLayout: 'BLANK',
            },
          },
        });

        const imageObjectId = `image_${requests.length}`;

        const positionX = (pageWidth + (pageWidth / 6) - imageWidth) / 2;
        const positionY = (pageHeight - imageHeight) / 2;

        requests.push({
          createImage: {
            objectId: imageObjectId,
            url: imageUrl,
            elementProperties: {
              pageObjectId: slideId,
              size: {
                height: {
                  magnitude: imageHeight,
                  unit: 'PT',
                },
                width: {
                  magnitude: imageWidth,
                  unit: 'PT',
                },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: positionX,
                translateY: positionY,
                unit: 'PT',
              },
            },
          },
        });
      }
    }
  }
}

chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name === "CreatePresentation");
  port.onMessage.addListener(function(msg) {
    if (msg.action === "CreatePresentation") {
      var url = msg.texts;
      const docIdMatch = url.match(/\/d\/([^\/]+)\/edit/);
      let docId;
      if (docIdMatch) {
        docId = docIdMatch[1];
      } else {
        port.postMessage({ response: "No URL" });
        return;
      }

      chrome.identity.getAuthToken({ interactive: true }, function (tokens) {
        if (chrome.runtime.lastError) {
          port.postMessage({ response: "Auth Fail" });
          return;
        }

        (async function() {
          var documentId = docId;
          var token = tokens;
          try {
            const docResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!docResponse.ok) {
              port.postMessage({ response: "Failed Fetch" });
              throw new Error(`Failed fetching document: ${docResponse.statusText}`);
            } else {
              const docContent = await docResponse.json();
              console.log(docContent);

              var pageWidth = docContent.documentStyle.pageSize !== undefined ? docContent.documentStyle.pageSize.width.magnitude : 692;
              var pageHeight = docContent.documentStyle.pageSize !== undefined ? docContent.documentStyle.pageSize.height.magnitude / 2 : 792 / 2;
              const docTitle = docContent.title || 'Untitled Presentation';

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
                port.postMessage({ response: "Failed Present" });
                throw new Error(`Failed to create presentation: ${presentationResponse.statusText}`);
              }

              const presentationData = await presentationResponse.json();
              const presentationId = presentationData.presentationId;

              const requests = [];

              for (let i = 0; i < docContent.body.content.length; i++) {
                const element = docContent.body.content[i];

                if (element.paragraph !== undefined) {
                  // Create a new slide for each non-null or non-newline textRun
                  element.paragraph.elements.forEach((el) => {
                    if (el.textRun && el.textRun.content.trim() !== '' && el.textRun.content !== '\n') {
                      const slideId = `slide_${requests.length + 1}`;

                      requests.push({
                        createSlide: {
                          objectId: slideId,
                          slideLayoutReference: {
                            predefinedLayout: 'BLANK',
                          },
                        },
                      });

                      handleParagraphElement({ paragraph: { elements: [el] } }, requests, pageWidth, pageHeight, slideId);
                    }
                  });
                } else if (element.inlineObjectElement !== undefined) {
                  handleInlineImages(docContent.inlineObjects, requests, pageWidth, pageHeight);
                }
              }

              const batchUpdateResponse = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  requests: requests,
                }),
              });

              if (!batchUpdateResponse.ok) {
                port.postMessage({ response: "Batch Fail" });
                throw new Error(`Failed batch update: ${batchUpdateResponse.statusText}`);
              }

              chrome.tabs.create({
                url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
                active: false
              });
              port.postMessage({response: "Complete"});
            }
          } catch (error) {
            console.error("An error occurred:", error);
            port.postMessage({ response: "Unexpected error occurred." });
          }
        })();
      });
    }
  });
});
