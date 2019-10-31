const Webcam = require('./webcam.js')
const Screen = require('./lib/screenmedia.js')

class HydraSource  {

  constructor (opts) {
    this.regl = opts.regl
    this.mediadiv = opts.mediadiv
    this.src = null
    this.dynamic = true
    this.width = opts.width
    this.height = opts.height
    this.tex = this.regl.texture({
      shape: [opts.width, opts.height]
    })
    this.pb = opts.pb
    this.element = null;
  }

  // Initialize source with custom options.
  init (opts) {
    this.reset();
    if (opts.src) {
      this.src = opts.src
      this.tex = this.regl.texture(this.src)
    }
    if(opts.dynamic) this.dynamic = opts.dynamic
  }

  // Initialize source from a webcam.
  initCam (index) {
    const self = this
    self.clear();
    Webcam(index).then((response) => {
      self.src = response.video
      self.tex = self.regl.texture(self.src)
    })
  }

  // Initialize source from RTC stream.
  initStream (streamName) {
    console.log("initing stream!", streamName)
    let self = this
    self.clear();
    if (streamName && this.pb) {
        this.pb.initSource(streamName)

        this.pb.on("got video", function(nick, video){
          if(nick === streamName) {
            self.src = video
            self.tex = self.regl.texture(self.src)
          }
        })

    }
  }

  // Initialize source using Chrome screen-capture-extension to show user's desktop.
  initScreen () {
    const self = this
    self.clear();
    Screen().then(function (response) {
       self.src = response.video
       self.tex = self.regl.texture(self.src)
     //  console.log("received screen input")
     })
  }

  // Initialize source from an image URL.
  //
  // The image must be hosted on the Hydra server, or have appropriate CORS headers.
  initImage (url) {
    this.clear();
    var element = document.createElement('img')
    this.mediadiv.appendChild(element);
    element.src = url
    element.crossOrigin = 'anonymous'
    this.src = this.element = element
    this.tex = this.regl.texture(this.src)
  }

  // Initialize source from an video URL.
  //
  // The video must be hosted on the Hydra server, or have appropriate CORS headers.
  initVideo (url, muted) {
    let self = this
    self.clear();
    var element = document.createElement('video')
    this.mediadiv.appendChild(element);
    element.src = url
    element.crossOrigin = 'anonymous'
    element.loop = true
    element.muted = true
    element.addEventListener('canplaythrough', (event) => {
      self.src = self.element = element
      self.tex = self.regl.texture(self.src)
      self.dynamic = true;
      element.play();
    })
  }

  resize (width, height) {
    this.width = width
    this.height = height
  }

  clear () {
    if (this.element) {
      this.element.remove()
      this.element = null;
    }
    this.src = null
    this.tex = null;
    this.tex = this.regl.texture({
      shape: [this.width, this.height]
    })
  }

  tick (time) {

    if (this.src !== null && this.dynamic === true) {
        if(this.src.videoWidth && this.src.videoWidth !== this.tex.width) {
          this.tex.resize(this.src.videoWidth, this.src.videoHeight)
        }
        this.tex.subimage(this.src)
       //this.tex = this.regl.texture(this.src)
    }
  }

  getTexture () {
    return this.tex
  }
}

module.exports = HydraSource
