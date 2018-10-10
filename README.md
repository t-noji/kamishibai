# kamishibai
Webブラウザ上で電子紙芝居を動かすエンジンです。  
Lisp形式でスクリプトを記述できます。スコープ、関数、マクロ、オブジェクトが使えます。  
JavaScript関数や変数が利用できます。  
リーダーマクロを利用してDSL化してあるので、Lispを知らなくてもわりと簡易です。  

# 使い方
0. git clone かなにかでダウンロードする
1. index.htmlを開き、source以下のテキストボックスにスクリプトを記述する  
2. Doボタンをクリックもしくはエンターキーを押す  
3. 結果が画面に反映される。もしくはreturn以下に戻り値が表記  
※構文エラーなどはJavaScriptコンソール内で表示

# お試し
お試しサイト  
http://nilisp.html.xdomain.jp  
スクリプト例  
http://nilisp.html.xdomain.jp/geeks/js_start0.lisp
# 文字列表示
キャラ名「キャラにセリフを吐かせることができます」  
　全角スペースを行頭に入れると地の文になります。  

# 紙芝居関数
* セーブに関与するタイトルをつけます
(title タイトル)
* 画像読み込み  
(image "url")
* 背景表示  
(bg image)  
例:  
 (def 背景 (image "url.jpg"))  
 (bg 背景)
* 全面画像  
(film 全面画像)  
画面を暗くする等画面効果に利用してください
* キャラクターを定義   
(make キャラ名  
  状態 画像  
  状態1 style)  
* キャラクターを表示  
(shows キャラ名 状態1 状態2)  
* キャラクター消去  
(clear キャラ名)  
もしくは  
(clear) ;全消去  
* 章の作成  
(chapter 章名  
  hogehoge)  
* 章を開始  
(script-eval 章名)  
* 画面に永続するボタンを作る  
(switch  
  (obj 'textContent "log") logview)  
* 選択肢を作る  
(switch  
  (obj 'textContent "選択肢1") #(() script-eval 章))

# Lisp由来の関数・マクロ・スペシャルフォーム
* 変数定義  
(def hoge 1)
* 関数定義  
(defun fuga (arg0 & args)
  args)
* 条件分岐  
(if 条件 真ならこれ 偽ならこれ)
* 無名関数  
(lambda (arg) フォーム)  
or  
#((arg) フォーム)
* オブジェクト  
(obj '連想名 中身)  
* マクロ  
(defmacro マクロ名  
  `(hoge ,@(fuga)))

# その他関数
* 外部スクリプトをロード  
(load "スクリプトのurl")  
※XMLHttpRequestを利用しているので、読み込めない場合もあります

# 初期パラメータ
* 起動時にスクリプトを読み込ませる  
urlに?load=urlを追加  
* 起動時に紙芝居画面だけを表示する  
urlに?replbox=hiddenを追加  
例：http://nilisp.html.xdomain.jp/?load=geeks/js_start0.lisp&replbox=hidden
