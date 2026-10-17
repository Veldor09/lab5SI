// Pruebas de integracion: backend Node.js (Express + Socket.IO) + una-lib.
// El chat envia los mensajes por Socket.IO con el evento 'Evento-Mensaje-Server',
// por eso se usa socket.io-client para ese evento y Supertest para la ruta HTTP.
var request = require('supertest');
var ioClient = require('socket.io-client');
var unalib = require('../../libs/unalib');
var servidor = require('../../server');

var EVENTO = 'Evento-Mensaje-Server';
var IMAGEN = 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg';
var VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
var SCRIPT = "<script>alert('Inyección de script');</script>";

var url;
var cliente;
var espia;

// envia un mensaje por el socket como lo hace index.html y espera la respuesta del servidor
function enviar(mensaje) {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () {
      reject(new Error('El servidor no respondio al mensaje'));
    }, 3000);

    cliente.once(EVENTO, function (respuesta) {
      clearTimeout(timer);
      resolve(JSON.parse(respuesta));
    });

    cliente.emit(EVENTO, JSON.stringify({ nombre: 'Diego', mensaje: mensaje, color: '#1A2B3C' }));
  });
}

beforeAll(function (done) {
  // puerto 0: el sistema asigna uno libre
  servidor.http.listen(0, function () {
    url = 'http://localhost:' + servidor.http.address().port;
    done();
  });
});

afterAll(function (done) {
  // io.close() cierra los sockets y tambien el servidor HTTP
  servidor.io.close(function () { done(); });
});

beforeEach(function (done) {
  espia = jest.spyOn(unalib, 'validarMensaje');
  cliente = ioClient(url, { transports: ['websocket'], forceNew: true });
  cliente.on('connect', done);
});

afterEach(function () {
  cliente.disconnect();
  espia.mockRestore();
});

describe('ruta HTTP GET /', function () {

  it('responde 200 con la pagina del chat', async function () {
    var res = await request(servidor.app).get('/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('Chat Socket.IO UNA');
  });

});

describe('evento Socket.IO del chat con una-lib', function () {

  it('acepta una URL de imagen valida y la devuelve como <img>', async function () {
    var res = await enviar(IMAGEN);

    expect(espia).toHaveBeenCalledTimes(1);
    expect(JSON.parse(espia.mock.calls[0][0]).mensaje).toBe(IMAGEN);
    expect(res.tipo).toBe('imagen');
    expect(res.mensaje).toMatch(/^<img src="https:&#x2F;&#x2F;upload\.wikimedia\.org&#x2F;.*Example\.jpg"/);
    expect(res.nombre).toBe('Diego');
    expect(res.color).toBe('#1A2B3C');
  });

  it('acepta una URL de video valida y la devuelve como <video>', async function () {
    var res = await enviar(VIDEO);

    expect(espia).toHaveBeenCalledTimes(1);
    expect(res.tipo).toBe('video');
    expect(res.mensaje).toMatch(/^<video src="https:&#x2F;&#x2F;.*flower\.mp4" controls/);
  });

  it('acepta un video de YouTube y lo devuelve como <iframe>', async function () {
    var res = await enviar('https://www.youtube.com/watch?v=qYwlqx-JLok');

    expect(espia).toHaveBeenCalledTimes(1);
    expect(res.tipo).toBe('video');
    expect(res.mensaje).toContain('src="https://www.youtube-nocookie.com/embed/qYwlqx-JLok"');
  });

  it('sanea el script del paso 2 y lo devuelve como texto', async function () {
    var res = await enviar(SCRIPT);

    expect(espia).toHaveBeenCalledTimes(1);
    expect(res.tipo).toBe('texto');
    expect(res.mensaje).not.toMatch(/<script/i);
    expect(res.mensaje).toBe('&lt;script&gt;alert(&#39;Inyección de script&#39;);&lt;&#x2F;script&gt;');
  });

  it('no convierte en etiqueta una URL no permitida', async function () {
    var res = await enviar('javascript:alert(1)//foto.jpg');

    expect(espia).toHaveBeenCalledTimes(1);
    expect(res.tipo).toBe('texto');
    expect(res.mensaje).not.toMatch(/[<>]/);
  });

  it('sanea un nombre de usuario con HTML', async function () {
    var res = await new Promise(function (resolve) {
      cliente.once(EVENTO, function (r) { resolve(JSON.parse(r)); });
      cliente.emit(EVENTO, JSON.stringify({ nombre: '<img src=x onerror=alert(1)>', mensaje: 'hola', color: '#000000' }));
    });

    expect(res.nombre).not.toMatch(/[<>]/);
    expect(res.mensaje).toBe('hola');
  });

});
