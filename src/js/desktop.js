/*
 *Kintone に別のKintone 詳細表示
 * Copyright (c) 2024 noz-23
 *  https://github.com/noz-23/
 *
 * Licensed under the MIT License
 * 
 *  利用：
 *   JQuery:
 *     https://jquery.com/
 *     https://js.cybozu.com/jquery/3.7.1/jquery.min.js
 *   
 *   jsrender:
 *     https://www.jsviews.com/
 *     https://js.cybozu.com/jsrender/1.0.13/jsrender.min.js
 * 
 * History
 *  2024/03/10 0.1.0 初版とりあえずバージョン
 *  2024/03/12 0.1.1 表示の不具合修正
 *  2024/03/24 0.2.0 プラグイン設定画面に Google AdSense 追加
 *  2024/04/17 0.2.1 許可値の不具合修正
 *  2024/08/01 0.2.2 設定htmlのチェック表示のクラス変更
 *  2024/09/07 0.2.3 URLの設定方法を変更
 */

jQuery.noConflict();

(async (PLUGIN_ID_) => {
  'use strict';

  const IFRAME_DATA = 'iframeData';	// 重複表示防止用のid名

  const EVENTS = [
    'app.record.detail.show', // 詳細表示
    'app.record.create.show', // 作成表示
    'app.record.edit.show',   // 編集表示
  ];
  kintone.events.on(EVENTS, async (events_) => {
    console.log('events_:%o', events_);

    // Kintone プラグイン 設定パラメータ
    const config = kintone.plugin.app.getConfig(PLUGIN_ID_);
    console.log("config:%o", config);
    // 
    const paramFieldLink = config['paramFieldLink'];
    const paramEditDetail = config['paramEditDetail'];
    const paramShowComment = config['paramShowComment'];

    // URL取得
    var linkUrl = events_.record[paramFieldLink].value;
    console.log("linkUrl:%o", linkUrl);

    // リンクの要らない部分の削除
    var iframeSrc = '';

    if (linkUrl.indexOf('/show#record=') > 0) {
      var linkPattern = /^https:\/\/([a-zA-Z0-9-+_]+).cybozu.(com|net)\/k\/[0-9]+\/show#record=[0-9]+/;
      var match = linkUrl.match(linkPattern);
      console.log("match:%o", match);
      if (!match) {
        return events_;
      }

      // "https://*.cybozu.com/k/742/show#record=1" 形式のURLが入る
      iframeSrc = match[0];
    } else if (linkUrl.indexOf('/report?report=') > 0) {
      iframeSrc = linkUrl;
    }

    console.log("iframeSrc:%o", iframeSrc);

    // 重複表示防止
    var frame = document.getElementById(IFRAME_DATA);
    if (frame != null || frame != undefined) {
      // 詳細表示後、編集などすると同じものが増えるのでIDで重複表示防止
      frame.remove();
    }

    // <iframe></iframe>タグの作成
    // css 化する予定
    frame = document.createElement("iframe");
    frame.id = IFRAME_DATA;
    frame.src = iframeSrc;
    frame.width = '80%';
    frame.height = '100%';
    console.log("frame:%o", iframeSrc);

    // iframeの追加
    // スペースでの割り当ての場合、｢contentWindow.onload｣が処理しないため、document.bodyで一番下に追加
    document.body.appendChild(frame);

    // iframe 読み込み後の処理
    frame.contentWindow.onload = () => {
      //console.log("document :%o",document);
      var frame = document.getElementsByTagName("iframe")[0].contentWindow.document;
      //console.log("frame:%o",frame);

      // 家のマークと説明
      DisplyaNoneByClassName(frame,'gaia-argoui-app-show-breadcrumb');
      DisplyaNoneByClassName(frame,'gaia-argoui-app-report-toolbar');
      DisplyaNoneByClassName(frame,'gaia-argoui-app-report-breadcrumb');

      // 右上の歯車のメニュー
      if (paramEditDetail == 'false') {
        DisplyaNoneByClassName(frame,'gaia-argoui-app-toolbar-menu');
        //DisplyaNoneByClassName(frame,'gaia-argoui-app-toolbar');
      }
      // コメント
      if (paramShowComment == 'false') {
        DisplyaNoneByClassName(frame,'gaia-argoui-app-show-sidebar');
      }
    };

    return events_;
  });

  var DisplyaNoneByClassName =(frame_,name_)=>{
    var elements = frame_.getElementsByClassName(name_);
    if (elements != null) {
      if (elements.length > 0) {
        var element = elements[0];
        //console.log("element:%o",element);
        element.style.display = 'none';
      }
    }    
  }

})(kintone.$PLUGIN_ID);

