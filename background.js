
browser.browserAction.onClicked.addListener(function(tab) {
  alert();
});
/////////////////////events///////////////////////////
$(document).ready(function() {

  var accessToken = "d3da1b6e0a024151a5efe7f09a099aab";
  var timevocal = 0;
  var baseUrl = "https://api.api.ai/v1/";
  var talking = true;
  var recognition;
  var txt;
  var id = 1; //for screenshots
  var voicetrigger;
  var status = "active"; //for storing listening status
  startRecognition();
  checkOnline();

  //first time when application will be loaded
  browser.storage.local.get( /* String or Array */ ["firsttime"], function(items2) {
      if (items2.firsttime === undefined || items2.firsttime === 2) {
          browser.storage.local.set({
              "firsttime": 3
          }, function() {
              browser.tabs.create({
                  "url": "elate/index.html"
              });
              getPermission();
          });
      }
  });

  //function for giving sleep 
  function sleep(milliseconds) {
      var start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
          if ((new Date().getTime() - start) > milliseconds) {
              break;
          }
      }
  }

  function getPermission() {
      var oldTabID;
      browser.tabs.query({
          active: true,
          currentWindow: true
      }, function(tabs) {
          oldTabID = tabs[0].id;
      });
      browser.tabs.create({
          active: true,
          url: 'permission.html'
      }, null);
      var permissionsTabID;
      browser.tabs.query({
          active: true,
          currentWindow: true
      }, function(tabs) {
          permissionsTabID = tabs[0].id;
      });
      browser.tabs.onRemoved.addListener(function switchTab(tabId) {
          if (tabId == permissionsTabID) {
              browser.tabs.update(oldTabID, {
                  selected: true
              }, function() {
                  // listen();
                  startRecognition();
              });
              chrome.extension.onRequest.removeListener(switchTab); //Syntax same in firefox too [ This is not implemented in Firefox because it has been deprecated since Chrome 33]
          }
      });
  };

  // check if browser is online or offline
  var offline = false;
  checkOnline();

  function checkOnline() {
      if (!navigator.onLine && !offline) {
          offline = true;
          browser.storage.local.set({
              "onoffswitch": "false"
          }, function() {

          });
      }
      if (navigator.onLine) {
          offline = false;
      }
      setTimeout(checkOnline, 1000);
  }

  /* method to change the anna status icon on page*/
  function changeStatus(newStatus) {

        browser.storage.local.get( /* String or Array */ ["statusicon"], function(items) {

            if ((items.statusicon === undefined) || (items.statusicon === "false")) {
                newStatus = "noIcon";
            }


            browser.tabs.query({
                active: true,
                currentWindow: true
            }, function(tabs) {

                try {
                    if (tabs[0] === undefined || tabs[0].url.startsWith("about://") || tabs[0].url.startsWith("about:debugging#addons://")){
                        throw "Internal Browser Page Active";
                    }
                    var tabId = tabs[0].id;

                    browser.tabs.executeScript(tabId, {
                        code: "var status =\"" + newStatus + "\";"
                    }, function() {
                        browser.tabs.executeScript(tabId, {
                            file: "js/set_status_icon.js"
                        }, function() {
                            // console.log("Status set to " + newStatus);
                        });
                    });
                } catch (e) {
                    // console.log("Error Message: " + e);
                }
            });
        });
    }

  //function for recognition
  function startRecognition() {
      browser.storage.local.get( /* String or Array */ ["onoffswitch"], function(items) {
          if (items.onoffswitch === "true") {
              changeStatus("listening");
              browser.browserAction.setIcon({path:"img/icon.png"});
              recognition = new SpeechRecognition();
              recognition.onstart = function(event) {
                  updateRec();
              };
              var text = "";
              recognition.onresult = function(event) {
                  for (var i = event.resultIndex; i < event.results.length; ++i) {
                      text += event.results[i][0].transcript;
                  }

                  //setInput("hey open facebook");

                  //stopRecognition();
              };
              recognition.onend = function() {
                  var our_trigger = "hey ";

                  if (text.toLowerCase() === our_trigger.toLowerCase()) {
                      changeStatus("active");
                      
                      // alert(text);
                      Speech("Yes Sir");
                      sleep(1500);
                      /*chrome.storage.local.clear(function() {
          var error = chrome.runtime.lastError;
          if (error) {
          console.error(error);
          }
        });*/
                      recognition.stop();
                      startRecognitionaftertrigger();
                  } else
                  if (text.toLowerCase().startsWith(our_trigger.toLowerCase())) {
                      changeStatus("active");
                      browser.browserAction.setIcon({path:"img/icon-active.png"});
                      var str = text.toLowerCase().replace(our_trigger.toLowerCase() + " ", "");
                      setInput(str);
                      recognition.stop();
                      setTimeout(startRecognition, 1000);
                  } else {
                      recognition.stop();
                      startRecognition();
                  }

                  // stopRecognition();
              };
              recognition.lang = "en-US";
              recognition.start();
          } else {
              changeStatus("inactive");
              browser.browserAction.setIcon({path:"img/icon-inactive.png"});
              startRecognition();
          }
      });
  }

  function setInput(text) {
      txt = text;
      send();
  }
  //start recognition after trigger
  function startRecognitionaftertrigger() {
      recognition = new SpeechRecognition();
      recognition.onstart = function(event) {
          //updateRec();
      };
      var text = "";
      recognition.onresult = function(event) {
          for (var i = event.resultIndex; i < event.results.length; ++i) {
              text += event.results[i][0].transcript;
          }
          //setInput(text);

          //stopRecognition();
      };
      recognition.onend = function() {
          if (text === "") {
              recognition.stop();
              startRecognition();
          } else {
              recognition.stop();
              setInput(text);
              startRecognition();
          }
      };
      recognition.lang = "en-US";
      recognition.start();
  }
  //to stop recognition
  function stopRecognition() {
      if (recognition) {
          recognition.stop();
          recognition = null;
      }
      // updateRec();
  }
  //to switch 
  function switchRecognition() {
      if (recognition) {
          stopRecognition();

      } else {
          startRecognition();
      }
  }
  //to set input 
  function setInput(text) {
      txt = text;
      send();
  }

  function updateRec() {

  }
  //sending the data to server
  function send() {
      // alert('you said ' + txt);
      // setResponse('you said ' + txt);
    //   console.log('user said ' + txt);
      txt = txt.replace('hey ', '');
      // alert(txt);
      tasks();
  }



  //sending the data to server
  function tasks() {
      $.ajax({
          type: "POST",
          url: baseUrl + "query?v=20150910",
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          headers: {
              "Authorization": "Bearer " + accessToken
          },
          data: JSON.stringify({
              query: txt,
              lang: "en",
              sessionId: "somerandomthing"
          }),
          success: function(data) {
              // setResponse(data.fulfillment.speech);
              setResponse(data.result.fulfillment.speech);
              // alert("intent " + data.result.metadata.intentName);
              if (data.result.metadata.intentName === "youtube") {
                  searchYoutube(data.result.parameters.any);
                  // chrome.tabs.create({ 'url': 'https://www.youtube.com/results?search_query=' + data.result.parameters.any });
              } else if (data.result.metadata.intentName === "open") {
                  browser.tabs.create({
                      "url": "http://www." + data.result.parameters.website
                  });
              } else if (data.result.metadata.intentName === "incognito") {
                  browser.windows.create({
                      url: "http://www.google.com",
                      incognito: true
                  });
                  browser.extension.isAllowedIncognitoAccess(function(isAllowedAccess) {
                      if (isAllowedAccess){
                        return;   
                      }
                      alert("Please allow incognito mode");
                      browser.tabs.create({
                          url: 'chrome://extensions/?id=' + browser.runtime.id  //check has been made to firefox
                      });
                      Speech("Now please click on the option Allow in incognito");
                  });
              } else if (data.result.metadata.intentName === "calendar") {
                  //Speech("please tell details about the event"); 
                  browser.identity.getProfileUserInfo(function(userInfo) {
                    //   console.log(userInfo.id);
                      browser.tabs.create({
                          'url': 'https://www.google.com/calendar/render?action=TEMPLATE&text=data.result.parameters.any&dates=data.result.parameters.dateTdata.result.parameters.timeZ&output=xml'
                      });
                  });
              } else if (data.result.metadata.intentName === "history") {
                  browser.tabs.create({
                      'url': 'chrome://history' //check has been made to firefox
                  });
              } else if (data.result.metadata.intentName === "downloads") {
                  browser.tabs.create({
                      'url': 'chrome://downloads' //check has been made to firefox
                  });
              } else if (data.result.metadata.intentName === "translate") {
                  browser.tabs.create({
                      'url': 'https://translate.google.com/#auto/en/data.result.parameters.any'
                  });
              } else if (data.result.metadata.intentName === "mail") {
                  browser.tabs.create({
                      'url': "https://mail.google.com/mail/?view=cm&fs=1&body=" + data.result.parameters.any
                  });
              } else if (data.result.metadata.intentName == "joke") {
                  tellJoke();
              }else if (data.result.metadata.intentName == "nextTab") {
                  swapTab();
              } else if (data.result.metadata.intentName == "reload") {
                  browser.tabs.reload();
              } else if (data.result.metadata.intentName == "bookmark") {
                  browser.tabs.getSelected(function(tab) {
                      browser.bookmarks.create({
                          'title': tab.title,
                          'url': tab.url
                      });
                  });
              } else if (data.result.metadata.intentName === "tweet") {
                  tweet(data.result.parameters.any);
                  // chrome.tabs.create({ 'url': "http://www." + data.result.parameters.website });
              } else if (data.result.metadata.intentName === "maps") {
                  browser.tabs.create({
                      'url': "https://www.google.com/maps/dir/" + data.result.parameters["geo-city"][0] + "/" + data.result.parameters["geo-city"][1]
                  });
              } else if (data.result.metadata.intentName === "restaurants") {
                  browser.tabs.create({
                      'url': "https://www.google.com/maps/search/" + data.result.parameters.any + "+" + "restaurants"
                  });
              } else if (data.result.metadata.intentName === "mapPlace") {
                  browser.tabs.create({
                      'url': "https://www.google.com/maps/?q=" + data.result.parameters.any
                  });
              } else if (data.result.metadata.intentName == "weather") {
                  weather(data.result.parameters.any);
              } else if (data.result.metadata.intentName == "screenshot") {
                  takeScreenshot();
              } else if (data.result.metadata.intentName == "reversesearch") {
                  reverseSearch();
            //   } else if (data.result.metadata.intentName == "ducky") {
            //       duckduckgoOrGoogle(data.result.parameters.any);
              } else if (data.result.source == "domains") {
                  setResponse(data.result.fulfillment.speech);
                  // alert(data.result.fulfillment.speech);
              } else if (data.result.metadata.intentName == "motivate") {
                  speakAQuote();
              } else if (data.result.metadata.intentName == "close") {
                  browser.tabs.getSelected(null, function(tab) {
                      tab = tab.id;
                      browser.tabs.remove(tab, function() {});
                      tabUrl = tab.url;
                      //alert(tab.url);
                  });
                  Speech("closing");
              } else {
                browser.tabs.create({
                    'url': 'http://google.com/search?q=' + txt
                });
                
              }
          },
          error: function() {
              alert("Sorry ! we are having some internal problem. Please Try again.");
              setResponse("Sorry ! we are having some internal problem. Please Try again.");
          }
      });
  }

  /*utility method to convert dataURL to a blob object*/
  function dataURItoBlob(dataURI) {
      // convert base64/URLEncoded data component to raw binary data held in a string
      var byteString;
      if (dataURI.split(',')[0].indexOf('base64') >= 0)
          byteString = atob(dataURI.split(',')[1]);
      else
          byteString = unescape(dataURI.split(',')[1]);

      // separate out the mime component
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

      // write the bytes of the string to a typed array
      var ia = new Uint8Array(byteString.length);
      for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
      }

      return new Blob([ia], {
          type: mimeString
      });
  }
  /*get cropped image from user*/
  function getCroppedImage(image, callbackMethod) {

    //   console.log("cropping image : callbackMethod : " + callbackMethod);
      browser.tabs.query({
          active: true,
          currentWindow: true
      }, function(tabs) {

          var tabid = tabs[0].id;

          browser.tabs.executeScript(tabid, {
              code: 'var imageurl ="' + image + '", callbackMethod = "' + callbackMethod + '";'
          }, function() {
              /*injecting cropperjs into current tab*/
              browser.tabs.executeScript(tabid, {
                  file: "js/cropperjs/cropper.js"
              }, function(response) {
                  /*injecting our content script into current tab*/
                  browser.tabs.executeScript(tabid, {
                      file: "js/content_script.js"
                  }, function(response) {
                    //   console.log("Indside background script!! id:" + tabid + ", response: " + JSON.stringify(response, null, 4));
                  });
              });
          });
      });
  }

  function reverseSearch() {
      browser.tabs.captureVisibleTab(function(screenshotUrl) {
          /*uploading the screenshot to a sever & generating url*/

          //asking for image crop from user
          if (confirm('Do you want to crop the image?')) {
              // get cropped image & proceed
              getCroppedImage(screenshotUrl, "reversesearch");
              browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
                  if (message.callbackMethod === "reversesearch") {
                      var blob = dataURItoBlob(message.croppedImage);
                      var fd = new FormData();
                      fd.append("file", blob);

                      var xhr = new XMLHttpRequest();
                      xhr.responseType = 'json';
                      xhr.open('POST', 'https://file.io', true);
                      xhr.onload = function() {
                          // Request finished, now opening new tab with google image search url.
                          if (this.response.success && this.response.success === true) {
                              /*opening new tab with the search results*/
                              var searchURL = "https://www.google.com/searchbyimage?&image_url=" + this.response.link;
                              browser.tabs.create({
                                  url: searchURL
                              }, function(tab) {
                                //   console.log("reverse search successful");
                              });
                          } else {
                            //   console.log("Sorry, Unable to perform reverse search!");
                          }
                      };
                      xhr.send(fd);
                  }
                  //removing message listener
                  browser.runtime.onMessage.removeListener(arguments.callee);
              });
          } else {
              // proceed as before
              var blob = dataURItoBlob(screenshotUrl);
              var fd = new FormData();
              fd.append("file", blob);

              var xhr = new XMLHttpRequest();
              xhr.responseType = 'json';
              xhr.open('POST', 'https://file.io', true);
              xhr.onload = function() {
                  // Request finished, now opening new tab with google image search url.
                  if (this.response.success && this.response.success === true) {
                      /*opening new tab with the search results*/
                      var searchURL = "https://www.google.com/searchbyimage?&image_url=" + this.response.link;
                      browser.tabs.create({
                          url: searchURL
                      }, function(tab) {
                        //   console.log("reverse search successful");
                      });
                  } else {
                    //   console.log("Sorry, Unable to perform reverse search!");
                  }
              };
              xhr.send(fd);
          }

      });
  }
function swapTab() {
   var currentTabId;
            browser.tabs.getSelected(null, function(tab) {
              currentTabId = tab.id;
              browser.tabs.query({}, function (tabs) {
                for (var i = 0; i < tabs.length; i++) {
                  if(tabs[i].id == currentTabId){
                    browser.tabs.update(tabs[data.result.parameters.number].id, { active: true});
                  }

                }
                  });
                  });
 }
  function takeScreenshot() {

      browser.tabs.captureVisibleTab(function(screenshotUrl) {
          var viewTabUrl = browser.extension.getURL('screenshot.html?id=' + id++)
          var targetId = null;

          //asking for image crop from user
          if (confirm('Do you want to crop the image?')) {
              // get cropped image & proceed
              //if user wants to crop image
              getCroppedImage(screenshotUrl, "screenshot");
              browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
                  if (message.callbackMethod === "screenshot") {
                    //   console.log("CroppedImage Recieved!!");

                      browser.tabs.onUpdated.addListener(function listener(tabId, changedProps) {
                          // we are waiting for the tab to be open
                          if (tabId != targetId || changedProps.status != "complete")
                              return;

                          browser.tabs.onUpdated.removeListener(listener);

                          // Look through all views to find the window which will display
                          // the screenshot, query paramater assures that it is unique
                          var views = browser.extension.getViews();
                          for (var i = 0; i < views.length; i++) {
                              var view = views[i];
                              if (view.location.href == viewTabUrl) {
                                  view.setScreenshotUrl(message.croppedImage);
                                  break;
                              }
                          }
                      });

                      browser.tabs.create({
                          url: viewTabUrl
                      }, function(tab) {
                          targetId = tab.id;
                      });
                  }

                  //removing message listener
                  browser.runtime.onMessage.removeListener(arguments.callee);
              });
          } else {
              // proceed as before
              browser.tabs.onUpdated.addListener(function listener(tabId, changedProps) {
                  // we are waiting for the tab to be open
                  if (tabId != targetId || changedProps.status != "complete")
                      return;

                  browser.tabs.onUpdated.removeListener(listener);

                  // Look through all views to find the window which will display
                  // the screenshot, query paramater assures that it is unique
                  var views = browser.extension.getViews();
                  for (var i = 0; i < views.length; i++) {
                      var view = views[i];
                      if (view.location.href == viewTabUrl) {
                          view.setScreenshotUrl(screenshotUrl);
                          break;
                      }
                  }
              });

              browser.tabs.create({
                  url: viewTabUrl
              }, function(tab) {
                  targetId = tab.id;
              });
          }
      });

  }

  function processIt(data) {
      var temperature = parseInt(data.main.temp - 273.15);
      var humidity = parseInt(data.main.humidity);
      var windSpeed = parseInt(data.wind.speed);
      var cloudsDescription = data.weather[0].description;
      var temperatureString = "temperature is  " + temperature;
      var humidityString = "humidity is " + humidity;
      var windSpeedString = "wind speed is " + windSpeed;
      var cloudsDescriptionString = "sky description " + cloudsDescription;

      var weather_response = temperatureString + ', ' +
          humidityString + ', ' +
          windSpeedString + ', ' +
          cloudsDescriptionString;

      setResponse(weather_response);
      alert(weather_response);

      //alert("temperature is  "+temperature);
      //alert("humidity is "+humidity);
      //alert("wind speed is "+windSpeed);
      //alert("sky description "+cloudsDescription);
  }

  function weather(city) {
      var baseUrl = "http://api.openweathermap.org/data/2.5/weather?q=";
      var key = "ec58b4518e2a455913f8e64a7ac16248";
      var Url = baseUrl + city + "&APPID=" + key;

      $.getJSON(Url, function(dataJson) {
          var data = JSON.stringify(dataJson);
          var parsedData = JSON.parse(data);
          processIt(parsedData);
      });
  }

  function tellJoke() {
      var jokeURL = 'https://icanhazdadjoke.com/';
      $.getJSON(jokeURL, function(data) {
          setResponse(data.joke.toLowerCase());
          browser.tabs.create({
              'url': jokeURL+'j/'+data.id
          });
      }).fail(function() {
          var failJoke = "Sorry! I can't read the joke! You can have a look at it!";
          setResponse(failJoke);
          browser.tabs.create({
              'url': 'https://icanhazdadjoke.com/'
          });
      });
  }

  // TO DO - Fix this
  function speakAQuote() {
      var quoteUrl = 'http://api.forismatic.com/api/1.0/?method=getQuote&lang=en&format=json';
      $.getJSON(quoteUrl, function(data) {
          // alert("inside");
          // alert(data.length);

          setResponse(data.quoteText);
          browser.tabs.create({
              'url': data.quoteLink
          });
      }).fail(function() {
          browser.tabs.create({
              'url': 'https://forismatic.com/en/homepage'
          });
      });
      // alert('m here');
  }

  function duckduckgoOrGoogle(query) {
      // alert('duckduckgoOrGoogle ' + query);
      var duckduckgoApiUrl = 'https://api.duckduckgo.com/';
      var remote = duckduckgoApiUrl + '?q=' + encodeURIComponent(query) + '&format=json';
      // alert(remote);

      $.getJSON(remote, function(data) {
          if (data.AbstractText != '') {
              setResponse(data.AbstractText);
              // alert(data.AbstractText);
              browser.tabs.create({
                  'url': 'https://duckduckgo.com/?q=' + encodeURIComponent(query)
              });
          } else {
              browser.tabs.create({
                  'url': 'http://google.com/search?q=' + encodeURIComponent(query)
              });
          }
      }).fail(function() {
          browser.tabs.create({
              'url': 'http://google.com/search?q=' + encodeURIComponent(query)
          });
      });

  }

  function tweet(tweets) {
      // var tweets=document.getElementById('tweetText').value;
      var url = 'http://twitter.com/home?status=' + encodeURIComponent(tweets);
      browser.tabs.create({
          'url': url
      });
      // openInNewTab(url);
  }

  function searchYoutube(temp) {
      var gapikey = 'AIzaSyBxg6zIGlqie7QxvFlGFTIIk4yWtgIlAak';
      q = temp;
      $.get(
          "https://www.googleapis.com/youtube/v3/search", {
              part: 'snippet, id',
              q: q,
              type: 'video',
              key: gapikey
          },
          function(data) {
              $.each(data.items, function(i, item) {
                  var videoID = item.id.videoId;
                  var nurl = "https://www.youtube.com/watch?v=" + videoID;
                  // alert(temp + videoID);
                  // openInNewTab(nurl);
                  browser.tabs.create({
                      'url': nurl
                  });
                  return false;
              });
          });
  }


  function setResponse(val) {
      Speech(val);
  }
  //to speech 
  function Speech(say) {
      if ('speechSynthesis' in window && talking) {
          var language = window.navigator.userLanguage || window.navigator.language;
          var utterance = new SpeechSynthesisUtterance(say);
          //msg.voice = voices[10]; // Note: some voices don't support altering params
          //msg.voiceURI = 'native';
          if (timevocal == 1) {
              utterance.volume = 1; // 0 to 1
              utterance.pitch = 0; //0 to 2
              utterance.voiceURI = 'native';
              utterance.lang = "en-IN";
              speechSynthesis.speak(utterance);
              timevocal = 0
          } else {
              utterance.volume = 1; // 0 to 1
              //utterance.rate = 0.1; // 0.1 to 10
              utterance.pitch = 0; //0 to 2
              //utterance.text = 'Hello World';
              utterance.voiceURI = 'native';
              utterance.lang = "hi-IN";
              speechSynthesis.speak(utterance);
          }
      }
  }
});
