var val = require('../../libs/unalib');
var assert = require('assert');

// arma el mensaje como lo envia el frontend y devuelve el objeto ya validado
function validar(mensaje, extra) {
  var msg = Object.assign({ nombre: 'Diego', mensaje: mensaje, color: '#123ABC' }, extra);
  return JSON.parse(val.validarMensaje(JSON.stringify(msg)));
}


describe('unalib', function(){


  describe('funcion is_valid_phone', function(){

    it('deberia devolver true para 8297-8547', function(){

      assert.equal(val.is_valid_phone('8297-8547'), true);

    });

    it('deberia devolver false para 8297p-8547', function(){

      assert.equal(val.is_valid_phone('8297p-8547'), false);

    });

  });


  describe('funcion is_valid_url_image', function(){

    it('deberia devolver true para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.jpg'), true);

    });

    it('deberia devolver true para http://image.com/image.gif', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.gif'), true);

    });

    it.each([
      'https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg',
      'https://example.com/fotos/gato.PNG',
      'https://example.com/a.jpeg?size=large',
      'https://example.com/a.webp',
      'http://example.com/a.bmp'
    ])('deberia devolver true para %s', function(url){

      assert.equal(val.is_valid_url_image(url), true);

    });

    it.each([
      'https://example.com/pagina.html',
      'https://example.com/imagen.jpg.exe',
      'ftp://example.com/a.jpg',
      'javascript:alert(1)//a.jpg',
      'data:image/png;base64,AAAA',
      'https://example.com/a.jpg" onerror="alert(1)',
      'https://example.com/a b.jpg',
      'imagen.jpg',
      '',
      null,
      undefined,
      123
    ])('deberia devolver false para %p', function(url){

      assert.equal(val.is_valid_url_image(url), false);

    });

  });


  describe('funcion is_valid_url_video', function(){

    it.each([
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      'https://example.com/videos/clip.webm',
      'http://example.com/clip.ogg',
      'https://example.com/clip.MP4?t=10'
    ])('deberia devolver true para %s', function(url){

      assert.equal(val.is_valid_url_video(url), true);

    });

    it.each([
      'https://example.com/clip.avi',
      'https://example.com/clip.mp4.html',
      'javascript:alert(1)//clip.mp4',
      'https://example.com/clip.mp4"><script>alert(1)</script>',
      'clip.mp4'
    ])('deberia devolver false para %s', function(url){

      assert.equal(val.is_valid_url_video(url), false);

    });

  });


  describe('funcion is_valid_yt_video', function(){

    it('deberia devolver true para https://www.youtube.com/watch?v=qYwlqx-JLok', function(){

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);

    });

    it.each([
      'https://youtu.be/qYwlqx-JLok',
      'https://www.youtube.com/embed/qYwlqx-JLok',
      'https://m.youtube.com/watch?v=qYwlqx-JLok&t=30'
    ])('deberia devolver true para %s', function(url){

      assert.equal(val.is_valid_yt_video(url), true);

    });

    it.each([
      'https://www.youtube.com/watch?v=corto',
      'https://www.youtube.com/watch?v=qYwlqx-JLok"><script>',
      'https://youtube.com.malicioso.com/watch?v=qYwlqx-JLok',
      'https://vimeo.com/123456789'
    ])('deberia devolver false para %s', function(url){

      assert.equal(val.is_valid_yt_video(url), false);

    });

  });


  describe('validacion de URLs de imagenes en validarMensaje', function(){

    it('convierte la URL de una imagen en una etiqueta <img>', function(){

      var res = validar('https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg');

      assert.equal(res.tipo, 'imagen');
      assert.match(res.mensaje, /^<img src="https:&#x2F;&#x2F;upload\.wikimedia\.org&#x2F;.*Example\.jpg" [^>]*>$/);

    });

    it('el <img> generado no contiene manejadores de eventos', function(){

      var res = validar('https://example.com/foto.png');

      assert.doesNotMatch(res.mensaje, /on\w+=/i);

    });

  });


  describe('validacion de URLs de videos en validarMensaje', function(){

    it('integra un reproductor <video> con controles para un mp4', function(){

      var res = validar('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4');

      assert.equal(res.tipo, 'video');
      assert.match(res.mensaje, /^<video src="https:&#x2F;&#x2F;interactive-examples\.mdn\.mozilla\.net&#x2F;.*flower\.mp4" controls[^>]*><\/video>$/);

    });

    it('integra un <iframe> de YouTube con el id del video', function(){

      var res = validar('https://www.youtube.com/watch?v=qYwlqx-JLok');

      assert.equal(res.tipo, 'video');
      assert.match(res.mensaje, /^<iframe [^>]*src="https:\/\/www\.youtube-nocookie\.com\/embed\/qYwlqx-JLok"/);

    });

  });


  describe('prevencion de inyeccion de scripts', function(){

    it('escapa el script del paso 2 del laboratorio', function(){

      var res = validar("<script>alert('Inyección de script');</script>");

      assert.equal(res.tipo, 'texto');
      assert.equal(res.mensaje, '&lt;script&gt;alert(&#39;Inyección de script&#39;);&lt;&#x2F;script&gt;');

    });

    it.each([
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<iframe src="javascript:alert(1)"></iframe>',
      '"><script>alert(document.cookie)</script>',
      '<a href="javascript:alert(1)">clic</a>',
      '<body onload=alert(1)>'
    ])('no deja etiquetas HTML ejecutables en %s', function(payload){

      var res = validar(payload);

      assert.equal(res.tipo, 'texto');
      assert.doesNotMatch(res.mensaje, /[<>"]/);

    });

    it('escapa el nombre del usuario', function(){

      var res = validar('hola', { nombre: '<script>alert(1)</script>' });

      assert.doesNotMatch(res.nombre, /[<>]/);

    });

    it('rechaza un color que no sea hexadecimal', function(){

      var res = validar('hola', { color: 'red;background:url(javascript:alert(1))' });

      assert.equal(res.color, '#000000');

    });

    it('conserva un color hexadecimal valido', function(){

      assert.equal(validar('hola').color, '#123ABC');

    });

    it('escapa un mensaje que no es JSON valido', function(){

      var res = JSON.parse(val.validarMensaje('<script>alert(1)</script>'));

      assert.equal(res.mensaje, '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');

    });

    it.each([undefined, null, '', 42])('devuelve un mensaje vacio para la entrada %p', function(entrada){

      var res = JSON.parse(val.validarMensaje(entrada));

      assert.equal(res.mensaje, '');

    });

    it('mantiene el texto normal legible', function(){

      var res = validar('Hola a todos');

      assert.equal(res.tipo, 'texto');
      assert.equal(res.mensaje, 'Hola a todos');

    });

  });

});
