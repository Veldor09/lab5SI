// modulo de validacion de mensajes del chat UNA.

// extensiones permitidas para imagenes y videos
var IMAGE_EXT = /\.(?:jpg|jpeg|png|gif|bmp|webp)$/i;
var VIDEO_EXT = /\.(?:mp4|webm|ogg)$/i;
// caracteres que nunca deben aparecer en una URL que se inserta en un atributo HTML
var UNSAFE_URL_CHARS = /[\s"'<>`\\]/;
var YT_ID = /^[\w-]{11}$/;

// convierte el texto en una URL http(s) valida, o null si no lo es
function parseHttpUrl(text) {
  if (typeof text !== 'string') return null;
  text = text.trim();
  if (text === '' || UNSAFE_URL_CHARS.test(text)) return null;

  try {
    var url = new URL(text);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname) return null;
    return url;
  } catch (e) {
    return null;
  }
}

module.exports = {


    // logica que valida si un telefono esta correcto...
    is_valid_phone: function (phone) {
      // inicializacion lazy
      var isValid = false;
      // expresion regular copiada de StackOverflow
      var re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i;

      // validacion Regex
      try {
        isValid = re.test(phone);
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
      // fin del try-catch block
    },

    // escapa los caracteres especiales de HTML para que el texto se muestre y no se ejecute
    escapeHtml: function (text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#96;')
        .replace(/\//g, '&#x2F;');
    },

    // true si la URL es http(s) y apunta a un archivo de imagen
    is_valid_url_image: function (url) {
      var parsed = parseHttpUrl(url);
      return parsed !== null && IMAGE_EXT.test(parsed.pathname);
    },

    // true si la URL es http(s) y apunta a un archivo de video (mp4, webm, ogg)
    is_valid_url_video: function (url) {
      var parsed = parseHttpUrl(url);
      return parsed !== null && VIDEO_EXT.test(parsed.pathname);
    },

    // true si la URL es un video de YouTube con un id valido
    is_valid_yt_video: function (url) {
      return this.getYTVideoId(url) !== null;
    },

    // devuelve el id de 11 caracteres de un video de YouTube, o null
    getYTVideoId: function (url) {
      var parsed = parseHttpUrl(url);
      if (parsed === null) return null;

      var host = parsed.hostname.replace(/^(www\.|m\.)/, '');
      var id = null;

      if (host === 'youtu.be') {
        id = parsed.pathname.slice(1);
      } else if (host === 'youtube.com') {
        if (parsed.pathname === '/watch') {
          id = parsed.searchParams.get('v');
        } else {
          var match = parsed.pathname.match(/^\/(?:embed|v|shorts)\/([^/]+)$/);
          id = match ? match[1] : null;
        }
      }

      return id && YT_ID.test(id) ? id : null;
    },

    getEmbeddedCode: function (url) {
      var id = this.getYTVideoId(url);
      return '<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/' + id +
        '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    },

    getImageTag: function (url) {
      var src = this.escapeHtml(parseHttpUrl(url).href);
      return '<img src="' + src + '" alt="imagen" style="max-height: 400px;max-width: 400px;">';
    },

    getVideoTag: function (url) {
      var src = this.escapeHtml(parseHttpUrl(url).href);
      return '<video src="' + src + '" controls preload="metadata" style="max-height: 400px;max-width: 400px;"></video>';
    },

    // valida el mensaje recibido del cliente y devuelve un JSON seguro para mostrar:
    // - nombre y texto se escapan para impedir inyecciones de scripts
    // - las URLs de imagenes o videos se convierten en su etiqueta HTML
    // - el color solo se acepta en formato hexadecimal
    validateMessage: function (msg) {
      var result = { nombre: 'Anonimo', mensaje: '', color: '#000000', tipo: 'texto' };

      if (!msg || typeof msg !== 'string') {
        return JSON.stringify(result);
      }

      var obj;
      try {
        obj = JSON.parse(msg);
      } catch (e) {
        console.log('Mensaje con formato invalido');
        result.mensaje = this.escapeHtml(msg);
        return JSON.stringify(result);
      }

      if (!obj || typeof obj !== 'object') {
        return JSON.stringify(result);
      }

      if (typeof obj.nombre === 'string' && obj.nombre.trim() !== '') {
        result.nombre = this.escapeHtml(obj.nombre.trim().slice(0, 50));
      }

      if (typeof obj.color === 'string' && /^#[0-9a-f]{6}$/i.test(obj.color)) {
        result.color = obj.color;
      }

      var texto = typeof obj.mensaje === 'string' ? obj.mensaje.trim() : '';

      if (this.is_valid_url_image(texto)) {
        console.log("Es una imagen!");
        result.tipo = 'imagen';
        result.mensaje = this.getImageTag(texto);
      }
      else if (this.is_valid_url_video(texto)) {
        console.log("Es un video!");
        result.tipo = 'video';
        result.mensaje = this.getVideoTag(texto);
      }
      else if (this.is_valid_yt_video(texto)) {
        console.log("Es un video de YouTube!");
        result.tipo = 'video';
        result.mensaje = this.getEmbeddedCode(texto);
      }
      else {
        console.log("Es un texto!");
        result.mensaje = this.escapeHtml(texto);
      }

      return JSON.stringify(result);
    },

    // alias en espanol, como se nombra en el enunciado del laboratorio
    validarMensaje: function (msg) {
      return this.validateMessage(msg);
    }

  // fin del modulo
  };
