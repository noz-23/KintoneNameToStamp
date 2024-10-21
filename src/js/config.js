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

(async (jQuery_, PLUGIN_ID_) => {
  'use strict';

  // 設定パラメータ
  const ParameterCountRow = 'paramCountRow';     // 行数
  const ParameterListRow = 'paramListRow';      // 行のデータ(JSON->テキスト)
  //const ParameterFieldUser = 'paramFieldUser';   // ユーザー選択フィールド

  // 環境設定
  const Parameter = {
    // 表示文字
    Lang: {
      en: {
        plugin_titile: 'Kintone User Select Field To Hanko Show Plugin',
        plugin_description: 'Set User Select Field',
        plugin_label: 'Please Setting User Select Field',
        label_user: 'User Select Field',
        plugin_cancel: 'Cancel',
        plugin_ok: ' Save ',
        alert_message: 'Please don\'t same fields',
        stamp_family: 'Family Name Only',
        stamp_family_1st: 'Family Name & 1st Name(1 Charctor)',
        stamp_image: 'Face Image'
      },
      ja: {
        plugin_titile: 'ユーザー選択表示をハンコにする プラグイン',
        plugin_description: 'ユーザー選択表示をハンコの様に表示します',
        plugin_label: 'ユーザー選択フィールドは設定して下さい',
        label_user: 'ユーザー選択フィールド',
        plugin_cancel: 'キャンセル',
        plugin_ok: '   保存  ',
        alert_message: 'フィールドは同じにしないで下さい',
        stamp_family: '名字だけ',
        stamp_family_1st: '名字と名前(1文字)',
        stamp_image: '顔写真'
      },
      DefaultSetting: 'ja',
      UseLang: {}
    },
    Html: {
      Form: '#plugin_setting_form',
      Title: '#plugin_titile',
      Description: '#plugin_description',
      TableBody: '#table_body',
      AddRow: '.add_row',
      RemoveRow: '.remove_row',
      Cancel: '#plugin_cancel',
      Ok: '#plugin_ok',
    },
    Elements: {
      FieldUser: '#field_user',
      SelectStamp: '#select_stamp'
    },
  };


  /*
  HTMLタグの削除
   引数　：htmlstr タグ(<>)を含んだ文字列
   戻り値：タグを含まない文字列
  */
  const escapeHtml = (htmlstr) => {
    return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&quot;').replace(/'/g, '&#39;');
  };

  /*
  ユーザーの言語設定の読み込み
   引数　：なし
   戻り値：なし
  */
  const settingLang = () => {
    // 言語設定の取得
    Parameter.Lang.UseLang = kintone.getLoginUser().language;
    switch (Parameter.Lang.UseLang) {
      case 'en':
      case 'ja':
        break;
      default:
        Parameter.Lang.UseLang = Parameter.Lang.DefaultSetting;
        break;
    }
    // 言語表示の変更
    var html = jQuery(Parameter.Html.Form).html();
    var tmpl = jQuery.templates(html);

    var useLanguage = Parameter.Lang[Parameter.Lang.UseLang];
    // 置き換え
    jQuery(Parameter.Html.Form).html(tmpl.render({ lang: useLanguage })).show();
  };

  /*
  フィールド設定
   引数　：なし
   戻り値：なし
  */
  const settingHtml = async () => {
    var listFeild = await kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', { 'app': kintone.app.getId() });

    console.log("listFeild:%o", listFeild);
    for (const key in listFeild.properties) {
      //console.log("properties key:%o",key);
      try {
        const prop = listFeild.properties[key];
        //console.log("prop:%o",prop);

        // ユーザー選択フィールドのみ入れる
        if (prop.type === 'USER_SELECT') {
          const option = jQuery('<option/>');
          option.attr('value', escapeHtml(prop.code)).text(escapeHtml(prop.label));
          console.log("Add LINK option:%o", option);
          jQuery(Parameter.Elements.FieldUser).append(option);
        }
      }
      catch (error) {
        console.log('error:%o', error);
      }
    }

    // 現在データの呼び出し
    var nowConfig = kintone.plugin.app.getConfig(PLUGIN_ID_);
    console.log('nowConfig:%o', nowConfig);

    var count = (nowConfig[ParameterCountRow]) ? Number(nowConfig[ParameterCountRow]) : (0);
    // 作ってから値入れ
    var table = jQuery(Parameter.Html.TableBody);
    for (var i = 1; i < count; i++) {
      var cloneTr = jQuery(Parameter.Html.TableBody + ' > tr').eq(0).clone(true);
      table.append(cloneTr);
    }

    // 現在データの表示
    if (nowConfig[ParameterListRow]) {
      var listRow = JSON.parse(nowConfig[ParameterListRow]);
      var listTr = jQuery(Parameter.Html.TableBody + ' > tr');
      for (var i = 0; i < count; i++) {
        var row = listTr.eq(i);
        jQuery(row).find(Parameter.Elements.FieldUser).val(listRow[i].FieldUser);
        jQuery(row).find(Parameter.Elements.SelectStamp).val(listRow[i].SelectStamp);
      }
    }

  };

  /*
  データの保存
   引数　：なし
   戻り値：なし
  */
  const saveSetting = () => {
    // 各パラメータの保存
    var config = {};
    var listTr = jQuery(Parameter.Html.TableBody + ' > tr');

    var listRow = [];
    var count = 0;
    for (var row of listTr) {
      console.log("row:%o", row);
      var fieldUser = jQuery(row).find(Parameter.Elements.FieldUser);
      console.log("fieldUser:%o", fieldUser);

      var selectStamp = jQuery(row).find(Parameter.Elements.SelectStamp);
      console.log("selectStamp:%o", selectStamp);
      //
      listRow.push({
        FieldUser: fieldUser.val(), SelectStamp: selectStamp.val()
      });
      count++;
    }
    config[ParameterCountRow] = '' + count;

    // 配列は一旦文字列化して保存
    config[ParameterListRow] = JSON.stringify(listRow);
    console.log('config:%o', config);

    // 重複フィールドのチェック
    for(var row of listRow){
      var f =listRow.filter(x=>x.FieldUser ==row.FieldUser);
      if(f.length >1){
        alert(Parameter.Lang[Parameter.Lang.UseLang].alert_message+'['+row.FieldUser+']');

        return;
      }

    }

    // 設定の保存
    kintone.plugin.app.setConfig(config);
  };


  /*
  行の追加
   引数　：なし
   戻り値：なし
  */
  function AddRow() {
    // ラムダ式のthisは全体になりボタンでなくなるためfunctionを利用
    console.log("AddRow this:%o", this);
    var add = jQuery(Parameter.Html.TableBody + ' > tr').eq(0).clone(true).insertAfter(jQuery(this).parent().parent());
  };

  /*
  行の削除
   引数　：なし
   戻り値：なし
  */
  function RemoveRow() {
    console.log("RemoveRow this:%o", this);
    jQuery(this).parent("td").parent("tr").remove();
  };

  // 言語設定
  settingLang();
  await settingHtml();

  // 保存
  jQuery(Parameter.Html.Ok).click(() => { saveSetting(); });
  // キャンセル
  jQuery(Parameter.Html.Cancel).click(() => { history.back(); });

  //行追加
  jQuery(Parameter.Html.AddRow).click(AddRow);
  jQuery(Parameter.Html.RemoveRow).click(RemoveRow);

})(jQuery, kintone.$PLUGIN_ID);
