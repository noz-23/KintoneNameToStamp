/*
 *Kintone ユーザー選択ハンコ表示
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
 *  2024/10/27 0.1.0 初版とりあえずバージョン
 *
 */


jQuery.noConflict();

(async (PLUGIN_ID_) => {
  'use strict';

  const SIZE_STAMP = 80;
  const SIZE_WAKU = 2;
  const SIZE_FONT_MEI = 16;

  // 設定パラメータ
  const ParameterCountRow = 'paramCountRow';     // 行数
  const ParameterListRow = 'paramListRow';      // 行のデータ(JSON->テキスト)

  const EVENTS = [
    'app.record.detail.show', // 詳細表示
    //'app.record.create.show', // 作成表示
    //'app.record.edit.show',   // 編集表示
  ];

  kintone.events.on(EVENTS, async (events_) => {
    console.log('events_:%o', events_);
    // Kintone プラグイン 設定パラメータ
    const config = kintone.plugin.app.getConfig(PLUGIN_ID_);
    console.log("config:%o", config);

    // テキストからJSONへ変換
    var listCount = Number(config[ParameterCountRow]);
    if (listCount == 0) {
      return events_;
    }

    // 設定列の変換
    var listRow = JSON.parse(config[ParameterListRow]);
    //console.log('listRow:%o', listRow);

    for (const data of listRow) {
      // 
      const paramFieldUser = data.FieldUser;
      const fieldUser = kintone.app.record.getFieldElement(paramFieldUser);

      // ユーザーIDの取得
      let paramUsers = { codes: [] };
      let listImage = [];
      let listSpan = fieldUser.getElementsByTagName('span');
      //console.log("listSpan:%o", listSpan);
      for (let i = 0; i < listSpan.length; i++) {
        let user = listSpan[i];
        // id = UserID-x-user 形式
        let pos = user.id.lastIndexOf('-');
        if (pos == -1) {
          continue;
        }
        let isUser = user.id.substring(pos);
        //console.log("isUser:%o", isUser);

        if (isUser !== '-user') {
          continue;
        }
        // ユーザーID
        let userId = user.id.substring(0, pos);
        userId = userId.substring(0, userId.lastIndexOf('-'));
        //console.log("userId:%o", userId);
        paramUsers.codes.push(userId);

        var img = user.getElementsByTagName('img');
        //console.log("user Img:%o", img[0]);

        listImage.push({ id: userId, img: img[0].src })
      }

      // サイズの変更
      EmelentSize(fieldUser, paramUsers.codes.length);
      //console.log("fieldUser:%o", fieldUser);

      var listGetUser = await kintone.api(kintone.api.url('/v1/users', true), 'GET', paramUsers);
      //console.log("listGetUser:%o", listGetUser);

      // 画像
      // https://community.cybozu.dev/t/topic/5226
      //var listDetail = await kintone.api('/k/api/people/user/list', 'POST', {});
      //console.log("listDetail:%o", listDetail);

      // 表示の削除
      var listUser = fieldUser.getElementsByTagName('ul');
      //console.log("listUser:%o", listUser);
      while (listUser.length > 0) {
        let user = listUser[0];
        user.remove();
      }

      switch (data.SelectStamp) {
        case 'stamp_family':
          for (let user of listGetUser.users) {
            //StampSei(fieldUser, user.surName);
            StampName(fieldUser, user.surName, '');
          }
          break;
        case 'stamp_family_1st':
          for (let user of listGetUser.users) {
            //StampSei(fieldUser, user.surName);
            StampName(fieldUser, user.surName, user.givenName);
          }
          break;
        case 'stamp_image':
          for (let img of listImage) {
            StampImage(fieldUser, img.img);
          }
          break;
      }
    }
    return events_;
  });


  const EmelentSize = (field_, count_) => {
    field_.style.width = '' + (SIZE_STAMP * count_) + "px";
    field_.style.height = '' + (SIZE_STAMP) + "px";
    field_.style.display = 'flex';

    const fieldParent = field_.parentElement;
    fieldParent.style.width = 'Auto';
    fieldParent.style.minWidth=''+SIZE_STAMP+'px';
    //console.log("fieldParent:%o", fieldParent);

    const listLabel = fieldParent.getElementsByClassName('control-label-gaia');
    for (let i = 0; i < listLabel.length; i++) {
      let label = listLabel[i];
      label.style.width = 'Auto';
      label.style.minWidth=''+SIZE_STAMP+'px';
      //console.log("label:%o", label);
    }


  };

  const StampName = (field_, sei_, mei_ = '') => {

    console.log("StampName:%o %o", sei_, mei_);

    let canvas = document.createElement('canvas');
    canvas.height = '' + SIZE_STAMP;
    canvas.width = '' + SIZE_STAMP;
    let context = canvas.getContext('2d');
    // https://qiita.com/kerupani129/items/179c907e5f66819e5562
    const offscreenCanvas = new OffscreenCanvas(SIZE_STAMP, SIZE_STAMP);
    context.drawImage(offscreenCanvas, 0, 0);

    //let offscreenCanvas = new OffscreenCanvas(100, 100);
    // https://qiita.com/yarimo/items/14e545de8157a66d5e99
    context.fillStyle = 'red'; // 線は赤色
    context.lineWidth = '0'; // 線の幅は5px
    context.beginPath(); // パスの初期化
    context.arc(SIZE_STAMP / 2, SIZE_STAMP / 2 - 1, SIZE_STAMP / 2 - 1, 0, 2 * Math.PI, true);
    context.arc(SIZE_STAMP / 2, SIZE_STAMP / 2 - 1, SIZE_STAMP / 2 - 1 - SIZE_WAKU, 0, 2 * Math.PI, false);
    context.closePath(); // パスを閉じる
    //context.stroke();
    context.fill();

    let nameSplit = sei_.split('');

    const fontSize = Number((SIZE_STAMP * 4) / (nameSplit.length * 5));
    context.font = '' + fontSize + 'px sans-serif';
    context.fillStyle = 'red'; // 線は赤色
    //context.strokeText(name, SIZE_STAMP/2, 0);
    for (let i = 0; i < nameSplit.length; i++) {
      // 縦書き
      context.fillText(nameSplit[i], (SIZE_STAMP - fontSize) / 2, SIZE_WAKU * 2 + fontSize * (i + 1));
    }
    //console.log("context:%o", context);

    if (mei_.length > 0) {
      context.font = '' + SIZE_FONT_MEI + 'px sans-serif';
      context.fillText(mei_[0], SIZE_WAKU * 3, (SIZE_STAMP + SIZE_FONT_MEI) / 2);
      //console.log("context:%o", context);
    }

    field_.appendChild(canvas);
  }

  const StampImage = (field_, img_) => {
    console.log("StampImage:%o", img_);
    //"small"     : "https://xxx.cybozu.com/api/user/photo.do/-/user.png?id=2&size=SMALL&hash=796e9a9a04311941993133386c3d138a17a7ec31&.png",
    //"size_56"   : "https://xxx.cybozu.com/api/user/photo.do/-/user.png?id=2&size=SIZE_56&hash=796e9a9a04311941993133386c3d138a17a7ec31&.png",
    //"normal"    : "https://xxx.cybozu.com/api/user/photo.do/-/user.png?id=2&size=NORMAL&hash=796e9a9a04311941993133386c3d138a17a7ec31&.png",
    //"size_32"   : "https://xxx.cybozu.com/api/user/photo.do/-/user.png?id=2&size=SIZE_32&hash=796e9a9a04311941993133386c3d138a17a7ec31&.png",
    //"original"  : "https://xxx.cybozu.com/api/user/photo.do/-/user.png?id=2&size=ORIGINAL&hash=796e9a9a04311941993133386c3d138a17a7ec31&.png",
    //"original_r": "https://xxx.cybozu.com/api/user/photo.do/-/user.png?id=2&size=ORIGINAL_R&hash=796e9a9a04311941993133386c3d138a17a7ec31&.png",
    //"size_40"   : "https://xxx.cybozu.com/api/user/photo.do/-/user.png?id=2&size=SIZE_40&hash=796e9a9a04311941993133386c3d138a17a7ec31&.png",
    //"size_48_r" : "https://xxx.cybozu.com/api/user/photo.do/-/user.png?id=2&size=SIZE_48_R&hash=796e9a9a04311941993133386c3d138a17a7ec31&.png",
    //"size_48"   : "https://xxx.cybozu.com/api/user/photo.do/-/user.png?id=2&size=SIZE_48&hash=796e9a9a04311941993133386c3d138a17a7ec31&.png",
    //"size_96_r" : "https://xxx.cybozu.com/api/user/photo.do/-/user.png?id=2&size=SIZE_96_R&hash=796e9a9a04311941993133386c3d138a17a7ec31&.png",
    //"size_24"   : "https://xxx.cybozu.com/api/user/photo.do/-/user.png?id=2&size=SIZE_24&hash=796e9a9a04311941993133386c3d138a17a7ec31&.png"
    var original = img_.replace('&size=SMALL&', '&size=ORIGINAL&');

    let image = document.createElement('img');
    image.height = '' + SIZE_STAMP;
    image.width = '' + SIZE_STAMP;

    image.src = original;
    field_.appendChild(image);
  }


})(kintone.$PLUGIN_ID);
