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

(async ( jQuery_,PLUGIN_ID_)=>{
  'use strict';

  // 設定パラメータ
  const ParameterFieldLink   ='paramFieldLink';   // リンクフィールド
  const ParameterEditDetail  ='paramEditDetail';        // 編集表示
  const ParameterShowComment ='paramShowComment';        // コメント表示

  // 環境設定
  const Parameter = {
  // 表示文字
    Lang:{
      en:{
        plugin_titile      : 'Kintone Detail Show In Other Kintone Detail Show Plugin',
        plugin_description : 'Set Link Field',
        plugin_label       : 'Please Setting Link Field',
        link_label         : 'Link Field               ',
        edit_label         : 'Edit Show Detail         ',
        comment_label      : 'Show Datail Comment      ',
        edit_detail        : 'Allow',
        show_comment       : 'Allow',
        plugin_cancel      : 'Cancel',
        plugin_ok          : ' Save ',
        alert_message      : 'Please don\'t same fields Organizations and Primary'
      },
      ja:{
        plugin_titile      : 'Kintone 詳細表示に別のKintone 詳細表示 プラグイン',
        plugin_description : 'Kintone 詳細表示に別のKintone 詳細表示を表示します',
        plugin_label       : 'リンクは設定して下さい',
        link_label         : 'リンクフィールド      ',
        edit_label         : '詳細の編集許可        ',
        comment_label      : '詳細のコメント表示    ',
        edit_detail        : '許可',
        show_comment       : '許可',
        plugin_cancel      : 'キャンセル',
        plugin_ok          : '   保存  ',
      },
      DefaultSetting:'ja',
      UseLang:{}
    },
    Html:{
      Form               : '#plugin_setting_form',
      Title              : '#plugin_titile',
      Description        : '#plugin_description',
      Label              : '#plugin_label',
      EditLabel          : '#edit_label',
      CommentLabel       : '#comment_label',
      Cancel             : '#plugin_cancel',
      Ok                 : '#plugin_ok',
    },
    Elements:{
      LinkField          : '#link_field',
      EditDetail         : '#edit_datail',
      ShowComment        : '#show_comment',
    },
  };
  
 
  /*
  HTMLタグの削除
   引数　：htmlstr タグ(<>)を含んだ文字列
   戻り値：タグを含まない文字列
  */
  const escapeHtml =(htmlstr)=>{
    return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&quot;').replace(/'/g, '&#39;');
  };  

  /*
  ユーザーの言語設定の読み込み
   引数　：なし
   戻り値：なし
  */
  const settingLang=()=>{
    // 言語設定の取得
    Parameter.Lang.UseLang = kintone.getLoginUser().language;
    switch( Parameter.Lang.UseLang)
    {
      case 'en':
      case 'ja':
        break;
      default:
        Parameter.Lang.UseLang =Parameter.Lang.DefaultSetting;
        break;
    }
    // 言語表示の変更
    var html = jQuery(Parameter.Html.Form).html();
    var tmpl = jQuery.templates(html);
    
    var useLanguage =Parameter.Lang[Parameter.Lang.UseLang];
    // 置き換え
    jQuery(Parameter.Html.Form).html(tmpl.render({lang:useLanguage})).show();
  };

  /*
  フィールド設定
   引数　：なし
   戻り値：なし
  */
  const settingHtml= async ()=>{
    var listFeild =await kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', {'app': kintone.app.getId()});
    console.log("listFeild:%o",listFeild);

    for (const key in listFeild.properties){
      //console.log("properties key:%o",key);
      try {
        const prop = listFeild.properties[key];
        //console.log("prop:%o",prop);
    
        // Linkフィールドのみ入れる
        if (prop.type === 'LINK'){
          const option = jQuery('<option/>');
          option.attr('value', escapeHtml(prop.code)).text(escapeHtml(prop.label));
          console.log("Add LINK option:%o",option);
          jQuery(Parameter.Elements.LinkField).append(option);
        }                 
      }
      catch (error) {
        console.log("error:%o",error);
      }

      // 現在データの呼び出し
      var nowConfig =kintone.plugin.app.getConfig(PLUGIN_ID_);
      console.log("nowConfig:%o",nowConfig);

      // 現在データの表示
      if(nowConfig[ParameterFieldLink]){
        jQuery(Parameter.Elements.LinkField).val(nowConfig[ParameterFieldLink]); 
      }
      if(nowConfig[ParameterEditDetail]){
        jQuery(Parameter.Elements.EditDetail).prop('checked', nowConfig[ParameterEditDetail] =='true'); 
      }
      if(nowConfig[ParameterShowComment]){
        jQuery(Parameter.Elements.ShowComment).prop('checked', nowConfig[ParameterShowComment] =='true'); 
      }
    }
  };

  /*
  データの保存
   引数　：なし
   戻り値：なし
  */
   const saveSetting=()=>{
    // 各パラメータの保存
    var config ={};
    config[ParameterFieldLink]=jQuery(Parameter.Elements.LinkField).val();
    config[ParameterEditDetail]=''+jQuery(Parameter.Elements.EditDetail).prop('checked');
    config[ParameterShowComment]=''+jQuery(Parameter.Elements.ShowComment).prop('checked');

    console.log('config:%o',config);

    // 設定の保存
    kintone.plugin.app.setConfig(config);
  };

  // 言語設定
  settingLang();
  await settingHtml();

  // 保存
  jQuery(Parameter.Html.Ok).click(() =>{saveSetting();});
  // キャンセル
  jQuery(Parameter.Html.Cancel).click(()=>{history.back();});
})(jQuery, kintone.$PLUGIN_ID);
