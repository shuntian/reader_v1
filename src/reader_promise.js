(function(){
  'use strict'
  var Utils = (function(){
    var prefix = 'html5_reader_'
    var StorageGetter = function(key){
      return localStorage.getItem(prefix+key);
    };
    var StorageSetter = function(key,value){
      return localStorage.setItem(prefix+key,value);
    };

    var getJSONP = function(url,callback){
      return $.jsonp({
        url: url,
        cache: true,
        callback: 'duokan_fiction_chapter',
        success : function(result){
          var data = $.base64.decode(result);
          var json = decodeURIComponent(escape(data));
          callback(json);
        }
      })
    }

    return {
      getJSONP:getJSONP,
      StorageGetter:StorageGetter,
      StorageSetter:StorageSetter
    }
  })();
  var Dom = {
    top_nav : $("#top-nav"),
    bottom_nav: $(".bottom_nav"),
    font_container: $(".font_container"),
    font_button: $("#font-button"),
    night_button: $("#night-button")
  }
  var Win = $(window);
  var Doc = $(document);
  var readerModel = null;
  var renderUI    = null;
  var RootContainer = $("#fiction_container")
  var initFontSize = Utils.StorageGetter("font_size");
  initFontSize = parseInt(initFontSize);
  if(initFontSize){
    RootContainer.css("fontSize",initFontSize);
  }else{
    initFontSize = 14;
  }
  var initBGColor = Utils.StorageGetter("background_color");
  if(initBGColor){
    RootContainer.css("backgroundColor",initBGColor);
  }
  var Chapter_id = Utils.StorageGetter("chapter_id");
  Chapter_id = parseInt(Chapter_id);
  function main(){
    //todo 整个项目的入口函数
    readerModel = ReaderModel();
    renderUI    = ReaderBaseFrame(RootContainer);
    readerModel.init(function(data){
      renderUI(data);
    });
    EventHandler();
  }

  function ReaderModel(){
    //todo 实现和阅读器相关的数据交互方法
    var ChapterTotal;
    var init = function(UIcallback){
      // getFictionInfo(function(){
      //   getCurChapterContent(Chapter_id,function(data){
      //     //todos 数据层，与UI层 交互；；
      //       UIcallback && UIcallback(data);
      //   })
      // })
      getFictionInfoPromise()
      .then(function(){
        return getCurChapterContentPromise();
      })
      .then(function(data){
        UIcallback && UIcallback(data);
      });
    }

    var getFictionInfo = function(callback){
      $.get('data/chapter.json',function(data){
        //todos 预留出来：：：
        if(!Chapter_id){
          Chapter_id = data.chapters[1].chapter_id;
        }
        ChapterTotal = data.chapters.length;
        callback && callback();
      },'json')
    }

    var getFictionInfoPromise = function(){
      return new Promise(function(resolve, reject){
        $.get('data/chapter.json',function(data){
          //todos 预留出来：：：
          if(data.result == 0){
            if(!Chapter_id){
              Chapter_id = data.chapters[1].chapter_id;
            }
            ChapterTotal = data.chapters.length;
            resolve();
          }else{
            reject();
          }
          
        },'json')
      });
    }

    var getCurChapterContent = function(chapter_id,callback){
      $.get('data/data'+ chapter_id + '.json',function(data){
        if(data.result == 0){
          var url = data.jsonp;
          Utils.getJSONP(url,function(data){
            callback && callback(data)
          });
        }
      },'json')
    }

    var getCurChapterContentPromise = function(){
      return new Promise(function(resolve, reject){
        $.get('data/data'+ Chapter_id + '.json',function(data){
          if(data.result == 0){
            var url = data.jsonp;
            Utils.getJSONP(url,function(data){
              resolve(data);
            });
          }else{
            reject({msg:'fail'});
          }
        },'json')
      });
    } 

    var prevChapter = function(UIcallback){
      Chapter_id = parseInt(Chapter_id, 10);
      if(Chapter_id == 1) return;
      Chapter_id -= 1;
      getCurChapterContent(Chapter_id,UIcallback);
      Utils.StorageSetter("chapter_id",Chapter_id);
    }
    
    var nextChapter = function(UIcallback){
      Chapter_id = parseInt(Chapter_id, 10);
      if(Chapter_id == ChapterTotal - 1) return;
      Chapter_id += 1;
      getCurChapterContent(Chapter_id,UIcallback);
      Utils.StorageSetter("chapter_id",Chapter_id);
    }

    return {
      init : init,
      prevChapter : prevChapter,
      nextChapter : nextChapter
    }
  }

  function ReaderBaseFrame(container){
    //todo 渲染基本的ui结构
    function parseChapterData(jsonData){
      var jsonObj = JSON.parse(jsonData);
      var html    = "<h4>" + jsonObj.t + "</h4>";
      for(var i = 0; i<jsonObj.p.length; i++){
        html += "<p>" + jsonObj.p[i] + "<p>";
      }
      return html;
    }

    return function(data){
      container.html(parseChapterData(data));
    }
  }

  function EventHandler(){
    //todo 交互的事件绑定
    $("#action_mid").click(function(){
      if(Dom.top_nav.css('display') == 'none'){
        Dom.top_nav.show();
        Dom.bottom_nav.show();
      }else{
        Dom.top_nav.hide();
        Dom.bottom_nav.hide();
        Dom.font_container.hide();
        Dom.font_button.removeClass("current");
      }
    });
    Win.scroll(function(){
      Dom.top_nav.hide();
      Dom.bottom_nav.hide();
      Dom.font_container.hide();
      Dom.font_button.removeClass("current");
    });
    Dom.font_button.click(function(event){
      if(Dom.font_container.css("display") == "none"){
        Dom.font_container.show();
        Dom.font_button.addClass("current");
      }else{
        Dom.font_container.hide();
        Dom.font_button.removeClass("current");
      }
    });
    Dom.night_button.click(function(){
      //todo 触发背景切换
      if(Dom.night_button.children(":first-child").css("display") == "none"){
        Dom.night_button.children(":first-child").css("display","block");
        Dom.night_button.children(":last-child").css("display","none");
        $("#bg-gray").click();
      }else{
        Dom.night_button.children(":first-child").css("display","none");
        Dom.night_button.children(":last-child").css("display","block");
        $("#bg-white").click();
      }

    })
    $("#large-font").click(function(){
      if(initFontSize > 20) return;
      initFontSize +=1;
      RootContainer.css("fontSize",initFontSize);
      Utils.StorageSetter("font_size",initFontSize);
    });
    
    $("#small-font").click(function(){
      if(initFontSize < 12) return;
      initFontSize -=1;
      RootContainer.css("fontSize",initFontSize);
      Utils.StorageSetter("font_size",initFontSize);
    });

    $("#bg-white").click(function(){
      RootContainer.css("backgroundColor","white");
      Utils.StorageSetter('background_color',"white");
    });

    $("#bg-red").click(function(){
      RootContainer.css("backgroundColor","red");
      Utils.StorageSetter('background_color',"red");
    });

    $("#bg-purple").click(function(){
      RootContainer.css("backgroundColor","purple");
      Utils.StorageSetter('background_color',"purple");
    });

    $("#bg-green").click(function(){
      RootContainer.css("backgroundColor","green");
      Utils.StorageSetter('background_color',"green");
    });

    $("#bg-gray").click(function(){
      RootContainer.css("backgroundColor","gray");
      Utils.StorageSetter('background_color',"gray");
    });

    $("#prev-button").click(function(){
      //todo 获得章节的页数 -> 把数据拿出来渲染
      readerModel.prevChapter(function(data){
        renderUI(data);
      })
    });
    $("#next-button").click(function(){
      readerModel.nextChapter(function(data){
        renderUI(data);
      })
    });
  }
  main();
})();