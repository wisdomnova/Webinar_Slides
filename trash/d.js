var iscomplete = false;
// Track the cumulative height for each slide
let slideHeights = {};
let imagePromises = [];
let previousElementWasBullet = false; // Track if the previous element was a bullet
var bulletheight = 0;

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
  slideHeights[slideId] += shapeHeight; // Add spacing between shapes
  return currentHeight; // Return the height before adding the new shape
}

function handleParagraphElement(element, requests, pageWidth, pageHeight, lists, slideId) {
  const textRuns = element.paragraph.elements.map(el => el.textRun).filter(tr => tr && tr.content.trim());

  if (textRuns.length === 0) {
    return;
  }

  if(textRuns.length > 1){
    for(var x = 0; x < textRuns.length; x ++ ){
      var textRunsSub = textRuns[x];

      if (textRunsSub.content.includes('\u000b')) {
        let resultArray = textRunsSub.content.split('\u000b\u000b');
        resultArray = resultArray.filter(segment => segment.trim() !== '');

        resultArray.forEach(function(item,count,index){

          const lines = Math.ceil(item.length / 40) + 1;
          const lineHeight = 20;
          const shapeHeight = lineHeight * lines;
          const slideHeight = 360;
          const slideWidth = 720;
          const slideCentre = slideHeight / 2;
          const shapeCentre = shapeHeight / 2;
          const translateY = slideCentre - shapeCentre;

          const objectId = `textbox_${requests.length}`;

          var currentSlideId = `slide_${requests.length + 1}`;
          requests.push({
            createSlide: {
              objectId: currentSlideId,
              slideLayoutReference: {
                predefinedLayout: 'BLANK', // Use blank layout to ensure no default title or subtitle
              },
            },
          });
          previousElementWasBullet = false;

          requests.push({
            createShape: {
              objectId,
              shapeType: 'TEXT_BOX',
              elementProperties: {
                pageObjectId: currentSlideId,
                size: {
                  height: {
                    magnitude: shapeHeight,
                    unit: 'PT',
                  },
                  width: {
                    magnitude: slideWidth,
                    unit: 'PT',
                  },
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: 0,
                  translateY: translateY,
                  unit: 'PT',
                },
              },
            },
          });

          const combinedText = item.replace('\n/g',"").replace(/\s$/, "");
          requests.push({
            insertText: {
              objectId,
              text: combinedText,
            },
          });
          let startIndex = 0;
            const { bold, underline, link, foregroundColor, fontSize, weightedFontFamily } = textRunsSub.textStyle;
        
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
                  startIndex: startIndex,
                  endIndex: startIndex + item.length,
                },
                fields: 'fontSize,foregroundColor,bold',
              },
            });
        
            startIndex += item.length;
    
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
        bulletheight = 0;
      } else {
        const lines = (Math.ceil(textRunsSub.content.length / 40) == 0 ? 1 : (Math.ceil(textRunsSub.content.length / 40)));
        const lineHeight = 20;
        const shapeHeight = lineHeight * lines;
        const slideHeight = 360;
        const slideWidth = 720;
        const slideCentre = slideHeight / 2;
        const shapeCentre = shapeHeight / 2;
        const translateY = slideCentre - shapeCentre;

        const objectId = `textbox_${requests.length}`;
  
        var currentSlideId = `slide_${requests.length + 1}`;
        requests.push({
          createSlide: {
            objectId: currentSlideId,
            slideLayoutReference: {
              predefinedLayout: 'BLANK', // Use blank layout to ensure no default title or subtitle
            },
          },
        });
  
        previousElementWasBullet = false;
  
        requests.push({
          createShape: {
            objectId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: currentSlideId,
              size: {
                height: {
                  magnitude: shapeHeight,
                  unit: 'PT',
                },
                width: {
                  magnitude: slideWidth,
                  unit: 'PT',
                },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 0,
                translateY: translateY,
                unit: 'PT',
              },
            },
          },
        });
  
        const combinedText = textRunsSub.content.replace('\n/g',"").replace(/\s$/, "");
        requests.push({
          insertText: {
            objectId,
            text: combinedText,
          },
        });
  
        let startIndex = 0;
          const { bold, underline, link, foregroundColor, fontSize, weightedFontFamily } = textRunsSub.textStyle;
      
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
                startIndex: startIndex,
                endIndex: startIndex + textRunsSub.content.length,
              },
              fields: 'fontSize,foregroundColor,bold',
            },
          });
      
          startIndex += textRunsSub.content.length;
  
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
      }
    }
    bulletheight = 0;
  }else{  
    const isListItem = element.paragraph.bullet !== undefined;
    const listId = element.paragraph.bullet?.listId;
    const list = lists && lists[listId];

    var textRunsOne = textRuns[0];
    if (textRunsOne.content.includes('\u000b') && !isListItem) {
      let resultArray = textRunsOne.content.split('\u000b\u000b');
      resultArray = resultArray.filter(segment => segment.trim() !== '');
      resultArray.forEach(function(item,count,index){

        const lines = Math.ceil(item.length / 40) + 1;
        const lineHeight = 20;
        const shapeHeight = lineHeight * lines;
        const slideHeight = 360;
        const slideWidth = 720;
        const slideCentre = slideHeight / 2;
        const shapeCentre = shapeHeight / 2;
        const translateY = slideCentre - shapeCentre;
        
        const objectId = `singletextbox_${requests.length}`;
      
        var currentSlideId = `singleslide_${requests.length + 1}`;

        requests.push({
          createSlide: {
            objectId: currentSlideId,
            slideLayoutReference: {
              predefinedLayout: 'BLANK', // Use blank layout to ensure no default title or subtitle
            },
          },
        });
        previousElementWasBullet = false;

        requests.push({
          createShape: {
            objectId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: currentSlideId,
              size: {
                height: {
                  magnitude: shapeHeight,
                  unit: 'PT',
                },
                width: {
                  magnitude: slideWidth,
                  unit: 'PT',
                },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 0,
                translateY: translateY,
                unit: 'PT',
              },
            },
          },
        });
      
        const combinedText = item.replace('\n/g',"").replace(/\s$/, "");  
        
        requests.push({
          insertText: {
            objectId,
            text: combinedText,
          },
        });
      
        let startIndex = 0;
          const { bold, underline, link, foregroundColor, fontSize, weightedFontFamily } = textRunsOne.textStyle;
      
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
                startIndex: startIndex,
                endIndex: startIndex + item.length,
              },
              fields: 'fontSize,foregroundColor,bold',
            },
          });
      
          startIndex += item.length;
      
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
        
      })
      bulletheight = 0;
    }else{
      
      const _lines = textRuns.map(run => run.content).join('');
      const lines = (Math.ceil(_lines.length / 40) < 2 ? (Math.ceil(_lines.length / 40) + 1) : (Math.ceil(_lines.length / 40)));
      const lineHeight = 20;
      const shapeHeight = lineHeight * lines;
      const slideHeight = 360;
      const slideWidth = 720;
      const slideCentre = slideHeight / 2;
      const shapeCentre = shapeHeight / 2;
      var translateY_ = (slideCentre - shapeCentre) / 2;

      
      function updateBulletHeight(res, isList){
        // if(isList && bulletheight == 0){
        //   translateY_ = translateY_ / 2;
        // }
        if(bulletheight == 0){
          bulletheight += translateY_;
          return translateY_;
        }else{
          return bulletheight += res;
        }
      }
      
      // const translateY = updateSlideHeight(slideId, shapeHeight);
      
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
                magnitude: slideWidth,
                unit: 'PT',
              },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 2,
              // translateY: translateY,
              translateY: updateBulletHeight(shapeHeight, isListItem),
              unit: 'PT',
            },
          },
        },
      });
    
      const combinedText = textRuns.map(run => run.content).join('').replace('\n/g',"").replace(/\s$/, "");  
      requests.push({
        insertText: {
          objectId,
          text: combinedText,
        },
      });
    
      let startIndex = 0;
      for (const run of textRuns) {
        const { bold, underline, link, foregroundColor, fontSize, weightedFontFamily } = run.textStyle;
    
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
              startIndex: startIndex,
              endIndex: startIndex + run.content.length,
            },
            fields: 'fontSize,foregroundColor,bold',
          },
        });
    
        startIndex += run.content.length;
      }
    
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
    
      if (isListItem) {
        const bulletPreset = list?.listProperties?.nestingLevels[0]?.glyphType === 'NUMBER' ? 'NUMBERED_DECIMAL': 'BULLET_DISC_CIRCLE_SQUARE';
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
  }

}

var previousImage = [];
var insertedTextId;

function sumArray(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

function currentTranslate(){
  var pageHeight = 3;
  if(previousImage == null){
    pageHeight = 3;
  }else{
    pageHeight = sumArray(previousImage);
  }
  return pageHeight;
}

function handleInlineImages(inlineObjects, element, requests, pageWidth, pageHeight, slideId) {
  if (inlineObjects !== undefined) {
    const embedded = inlineObjects.paragraph.elements;
    for(var j = 0 ; j < embedded.length; j++){
      if(embedded[j].inlineObjectElement){
        const embeddedId = embedded[j].inlineObjectElement.inlineObjectId.toString();
        const embeddedObject = element[embeddedId].inlineObjectProperties.embeddedObject;
        if (embeddedObject && embeddedObject.imageProperties) {
          const imageUrl = embeddedObject.imageProperties.contentUri;
          const imageHeight = embeddedObject.size.height.magnitude; // Use exact height
          const imageWidth = embeddedObject.size.width.magnitude; // Use exact width
      
          const imageObjectId = `image_${requests.length}`;
          
          // Calculate positions to center the image in the middle of the shape
          const positionX = (pageWidth + (pageWidth / 6) - imageWidth) / 2; // Center horizontally
          const positionY = (pageHeight - imageHeight) / 2; // Center vertically

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
                  translateY: currentTranslate(),
                  // translateY: positionY, // Centered vertically within the slide's shape area
                  unit: 'PT',
                },
              },
            },
          });

          previousImage.push(imageHeight);
        }  
      }
    }
  }
}

function handleTableElement(element, requests, pageWidth, slideId, docContent) {
  // Check if the element is a table
  if (!element.table) {
      return;
  }

  const table = element.table;
  const rows = table.rows;
  const columns = table.columns;

  // Create a table on the slide
  const tableObjectId = `table_${requests.length}`;
  requests.push({
      createTable: {
          objectId: tableObjectId,
          elementProperties: {
              pageObjectId: slideId,
              size: {
                  width: {
                      magnitude: pageWidth,
                      unit: 'PT',
                  },
                  height: {
                      magnitude: rows * 30, // Approximate height
                      unit: 'PT',
                  },
              },
              transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: 5,
                  translateY: 0,
                  unit: 'PT',
              },
          },
          rows: rows,
          columns: columns,
      },
  });

  // Iterate over table rows
  table.tableRows.forEach((row, rowIndex) => {
      // Iterate over each cell in the row
      row.tableCells.forEach((cell, colIndex) => {
          cell.content.forEach((cellContent) => {
              // Handle paragraph elements in the cell
              if (cellContent.paragraph) {
                  const textRuns = cellContent.paragraph.elements.map(el => el.textRun).filter(tr => tr && tr.content.trim());

                  // Check for textRun or inlineObjectElement
                  cellContent.paragraph.elements.forEach((el) => {
                      if (el.textRun && el.textRun.content.trim()) {
                          requests.push({
                              insertText: {
                                  objectId: tableObjectId,
                                  text: el.textRun.content,
                                  cellLocation: {
                                      rowIndex: rowIndex,
                                      columnIndex: colIndex,
                                  },
                              },
                          });
                      } else if (el.inlineObjectElement) {
                          const inlineObjectId = el.inlineObjectElement.inlineObjectId;
                          const inlineImage = docContent.inlineObjects[inlineObjectId].inlineObjectProperties.embeddedObject.imageProperties;
                          const inlineImageUrl = inlineImage.contentUri;
                          // Add image inside the table cell
                          requests.push({
                            insertImage: {
                              objectId: tableObjectId,
                              cellLocation: {
                                rowIndex: rowIndex,
                                columnIndex: colIndex,
                              },
                              imageUrl: inlineImageUrl,
                            },
                          });


                      }
                  });
              }
          });
      });
  });
}

function handleTableElement(element, requests, pageWidth, slideId, docContent) {
  if (!element.table) return;

  const table = element.table;
  const rows = table.rows;
  const columns = table.columns;
  let hasImages = false;

  // Check for images in the table content
  table.tableRows.forEach(row => {
      row.tableCells.forEach(cell => {
          cell.content.forEach(content => {
              if (content.paragraph) {
                  content.paragraph.elements.forEach(el => {
                      if (el.inlineObjectElement) {
                          hasImages = true;
                      }
                  });
              }
          });
      });
  });

  if (hasImages) {
      // Handle images: Do not create a table, place images directly on the slide
      table.tableRows.forEach((row, rowIndex) => {
          row.tableCells.forEach((cell, colIndex) => {
              cell.content.forEach(content => {
                  if (content.paragraph) {
                      content.paragraph.elements.forEach(el => {
                          if (el.inlineObjectElement) {
                              const inlineObjectId = el.inlineObjectElement.inlineObjectId;
                              const inlineImage = docContent.inlineObjects[inlineObjectId].inlineObjectProperties.embeddedObject;
                              const inlineImageUrl = inlineImage.imageProperties.contentUri;
                              const InlineImageWidth = inlineImage.size.width.magnitude;
                              const InlineImageHeight = inlineImage.size.height.magnitude;
 
                              // Insert image directly on the slide
                              requests.push({
                                  createImage: {
                                      objectId: `_image_${requests.length}`,
                                      url: inlineImageUrl, // Replace with actual image URL
                                      elementProperties: {
                                          pageObjectId: slideId,
                                          size: {
                                              width: {
                                                  magnitude: InlineImageWidth, // Adjust size as needed
                                                  unit: 'PT',
                                              },
                                              height: {
                                                  magnitude: InlineImageHeight,
                                                  unit: 'PT',
                                              },
                                          },
                                          transform: {
                                              scaleX: 1,
                                              scaleY: 1,
                                              translateX: colIndex * InlineImageWidth, // Positioning images horizontally
                                              translateY: rowIndex * 120, // Positioning images vertically
                                              unit: 'PT',
                                          },
                                      },
                                  },
                              });
                          }
                      });
                  }
              });
          });
      });
  } else {
      // Handle text: Create a table in the slide
      const tableObjectId = `table_${requests.length}`;
      requests.push({
          createTable: {
              objectId: tableObjectId,
              elementProperties: {
                  pageObjectId: slideId,
                  size: {
                      width: {
                          magnitude: pageWidth,
                          unit: 'PT',
                      },
                      height: {
                          magnitude: rows * 30, // Approximate height
                          unit: 'PT',
                      },
                  },
                  transform: {
                      scaleX: 1,
                      scaleY: 1,
                      translateX: pageWidth / 12,
                      translateY: pageWidth / 6,
                      // translateY: 0,
                      unit: 'PT',
                  },
              },
              rows: rows,
              columns: columns,
          },
      });

      // Insert text into table cells
      table.tableRows.forEach((row, rowIndex) => {
          row.tableCells.forEach((cell, colIndex) => {
              cell.content.forEach(content => {
                  if (content.paragraph) {
                      content.paragraph.elements.forEach(el => {
                          if (el.textRun && el.textRun.content.trim()) {
                              requests.push({
                                  insertText: {
                                      objectId: tableObjectId,
                                      text: el.textRun.content,
                                      cellLocation: {
                                          rowIndex: rowIndex,
                                          columnIndex: colIndex,
                                      },
                                  },
                              });
                          }
                      });
                  }
              });
          });
      });
  }
}


chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name === "CreatePresentation");
      port.onMessage.addListener(function(msg) {
        if (msg.action === "CreatePresentation"){
            var url = msg.texts;
            const docIdMatch = url.match(/\/d\/([^\/]+)\/edit/);
            let docId;
            if(docIdMatch) {
                docId = docIdMatch[1];
            }else{
              // console.log('No DOC to extract');
              port.postMessage({response: "No URL"});
              return;
            }

        chrome.identity.getAuthToken({ interactive: true }, function (tokens) {
            
            if (chrome.runtime.lastError) {
              port.postMessage({response: "Auth Fail"});
              return;
            }

            (async function() {
              var documentId = docId;
              var token = tokens;
              try {
                // Retrieve the contents of the Google Doc
                const docResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
            
                if (!docResponse.ok) {
                  port.postMessage({response: "Failed Fetch"});
                  throw new Error(`Failed fetching documennt: ${docResponse.statusText}`);
                }else{

                  const docContent = await docResponse.json();
                  
                  console.log(docContent);
              
                  // Extract page width and height from the document style in JSON
                  var pageWidth = docContent.documentStyle.pageSize !== undefined ? docContent.documentStyle.pageSize.width.magnitude : 692;  // Page width
                  var pageHeight = docContent.documentStyle.pageSize !== undefined ? docContent.documentStyle.pageSize.height.magnitude / 2 : 792 / 2;  // Half the page height
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
                    port.postMessage({response: "Failed Present"});
                    // throw new Error(`Failed to create presentation: ${presentationResponse.statusText}`);
                  }
                  if(docContent.body.content[1].paragraph.elements[0].textRun.content.trim() == "Les 3 Tunnels HIGH TICKET INTEMPORELSpour Transformer ta Personal Brand et tes Ads"){
                    docContent.body.content[1].paragraph.elements[0].textRun.content += "en Machine à cash high ticket en 2024";
                    docContent.body.content.splice(2, 1);
                  }

                  const presentationData = await presentationResponse.json();
                  const presentationId = presentationData.presentationId;
              
                  // Initialize slide creation requests
                  const requests = [];
                  let currentSlideId = null;   // Track the current slide ID
                  
                  // Extract content and styles from the document
                  for (let i = 0; i < docContent.body.content.length; i++) {
                    const element = docContent.body.content[i];                  
                    // Check if the element is a paragraph and not just a newline
                    if(element.table){
                        var currentTableId = `slides_${requests.length + 1}`;
                        requests.push({
                          createSlide: {
                            objectId: currentTableId,
                            slideLayoutReference: {
                              predefinedLayout: 'BLANK', // Use blank layout to ensure no default title or subtitle
                            },
                          },
                        });
                        previousElementWasBullet = false;
                        handleTableElement(element, requests, pageWidth, currentTableId, docContent);
                    }
                    // Check if the element is a paragraph and not just a newline
                    if (element.paragraph) {
                      // Check if this paragraph is a bullet
                      const isBullet = element.paragraph.bullet !== undefined;
                      const textRuns = element.paragraph.elements.map(el => el.textRun).filter(tr => tr && tr.content.trim());
                      const textContent = element.paragraph.elements
                      .map(el => el.textRun?.content || '')
                      .join('')
                      .trim();

                      const imageContent = element.paragraph.elements
                        .map(el => el?.inlineObjectElement || '')
                        .join('')
                        .trim();

                      if (isBullet) {
                        // If the previous element was not a bullet, create a new slide
                        if (!previousElementWasBullet) {
                          currentSlideId = `bullet_slide_${requests.length + 1}`;
                          requests.push({
                            createSlide: {
                              objectId: currentSlideId,
                              slideLayoutReference: {
                                predefinedLayout: 'BLANK',
                              },
                            },
                          });
                        }
                        // Handle the bullet point within the same slide
                        handleParagraphElement(element, requests, pageWidth, pageHeight, docContent.lists, currentSlideId);
                        previousElementWasBullet = true; // Mark as a bullet

                      } else if (!currentSlideId || imageContent || (textContent && textContent !== '\n') && !isBullet) {

                          if(textContent && !isBullet){

                            if(textRuns.length < 2){
                              var textRunsOne = textRuns[0].content;

                              if(!textRunsOne.includes('\u000b')){

                                currentSlideId = `slide_${requests.length + 1}`;
                                requests.push({
                                  createSlide: {
                                    objectId: currentSlideId,
                                    slideLayoutReference: {
                                      predefinedLayout: 'BLANK', // Use blank layout to ensure no default title or subtitle
                                    },
                                  },
                                });

                                previousElementWasBullet = false;
                              }
                            }

                            handleParagraphElement(element, requests, pageWidth, pageHeight, docContent.lists, currentSlideId);
                            insertedTextId = currentSlideId;
                          }

                          if(imageContent){

                            if(insertedTextId == currentSlideId){

                              const newslideId = `slide_${requests.length + 1}`;
                              requests.push({
                                createSlide: {
                                  objectId: newslideId,
                                  slideLayoutReference: {
                                    predefinedLayout: 'BLANK', // Use blank layout to ensure no default title or subtitle
                                  },
                                },
                              });

                              previousElementWasBullet = false;
                              previousImage = [];
                              handleInlineImages(element, docContent.inlineObjects, requests, pageWidth, pageHeight, newslideId);

                            }else{
                              
                              currentSlideId = `slide_${requests.length + 1}`;
                              requests.push({
                                createSlide: {
                                  objectId: currentSlideId,
                                  slideLayoutReference: {
                                    predefinedLayout: 'BLANK', // Use blank layout to ensure no default title or subtitle
                                  },
                                },
                              });

                              previousElementWasBullet = false;
                              previousImage = [];
                              handleInlineImages(element, docContent.inlineObjects, requests, pageWidth, pageHeight, currentSlideId);

                            }

                          }
                      }
                    }
                  }
              
                  // Handle images from the inlineObjects
                  // handleInlineImages(docContent.inlineObjects, requests, pageWidth, pageHeight, currentSlideId);
              
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
                      port.postMessage({response: "Failed Present"});
                      // console.log(updateResponse);
                      // throw new Error(`Failed to update slides: ${updateResponse.statusText}`);
                    }else{
                      chrome.tabs.create({
                        url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
                        active: false
                      });
                      port.postMessage({response: "Complete"});
                    }
                  }
                }           
              }catch(error) {
                console.log(error);
                port.postMessage({response: "Error"});
              }
          })();
        }
      )}
    }
  );
});
