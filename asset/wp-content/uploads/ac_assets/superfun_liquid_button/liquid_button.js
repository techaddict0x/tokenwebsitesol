const LiquidButton = class LiquidButton {
  constructor(button) {
    const { width, height } = button.getBoundingClientRect();
    const buttonStyles = window.getComputedStyle(button);
    const options = button.dataset || {};
	
    this.font = `${buttonStyles['font-size']} ${buttonStyles['font-family']}`;
    this.tension = options.tension || 0.4;
	this.width = width;
    this.height = height;
    this.margin = options.margin || 30;
	
	this.margin = parseInt(this.margin);
	
    // assume the padding it the same all around
    this.padding = parseFloat(buttonStyles.paddingRight);
    this.hoverFactor = options.hoverFactor || 0.5;
    this.gap = options.gap || 5;
    this.debug = options.debug || false;
    this.forceFactor = options.forceFactor || 0.2;
    this.color1 = options.color1 || '#ff0000';
    this.color2 = options.color2 || '#008af5';
    this.color3 = options.color3 || '#fff900';
    this.textColor = buttonStyles.color || '#FFFFFF';
    this.layers = [{
      points: [],
      viscosity: 0.5,
      mouseForce: 100,
      forceLimit: 2,
    }, {
      points: [],
      viscosity: 0.8,
      mouseForce: 150,
      forceLimit: 3,
    }];
    this.text = button.textContent;
    this.canvas = options.canvas || document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    // this.wrapperElement = options.wrapperElement || document.body;
    // if (!this.canvas.parentElement) {
    //   this.wrapperElement.append(this.canvas);
    // }
    button.append(this.canvas)
    this.touches = [];
    this.noise = options.noise || 0;
    button.addEventListener('mousemove', this.mousemove);
    button.addEventListener('mouseout', this.mouseout);
    this.initOrigins();
    this.animate();
    this.restingFace();
  }

  restingFace() {
    // force a mouse move on each button
    this.mousemove({ offsetX: Math.random() * this.width, offsetY: 1 })
  }

  get mousemove() {
    return (e) => {
      this.touches = [{
        x: e.offsetX,
        y: e.offsetY,
        z: 0,
        force: 1,
      }];
    };
  }

  get mouseout() {
    return (e) => {
      this.touches = [];
      this.restingFace();
    };
  }

  get raf() {
    return this.__raf || (this.__raf = (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function (callback) { setTimeout(callback, 10) }
    ).bind(window));
  }

  distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  update() {
    for (let layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
      const layer = this.layers[layerIndex];
      const points = layer.points;
      for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
        const point = points[pointIndex];
        const dx = point.ox - point.x + (Math.random() - 0.5) * this.noise;
        const dy = point.oy - point.y + (Math.random() - 0.5) * this.noise;
        const d = Math.sqrt(dx * dx + dy * dy);
        const f = d * this.forceFactor;
        point.vx += f * ((dx / d) || 0);
        point.vy += f * ((dy / d) || 0);
        for (let touchIndex = 0; touchIndex < this.touches.length; touchIndex++) {
          const touch = this.touches[touchIndex];
          let mouseForce = layer.mouseForce;
          if (
            touch.x > this.margin &&
            touch.x < this.margin + this.width &&
            touch.y > this.margin &&
            touch.y < this.margin + this.height
          ) {
            mouseForce *= -this.hoverFactor;
          }
          const mx = point.x - touch.x;
          const my = point.y - touch.y;
          const md = Math.sqrt(mx * mx + my * my);
          const mf = Math.max(-layer.forceLimit, Math.min(layer.forceLimit, (mouseForce * touch.force) / md));
          point.vx += mf * ((mx / md) || 0);
          point.vy += mf * ((my / md) || 0);
        }
        point.vx *= layer.viscosity;
        point.vy *= layer.viscosity;
        point.x += point.vx;
        point.y += point.vy;
      }
      for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
        const prev = points[(pointIndex + points.length - 1) % points.length];
        const point = points[pointIndex];
        const next = points[(pointIndex + points.length + 1) % points.length];
        const dPrev = this.distance(point, prev);
        const dNext = this.distance(point, next);

        const line = {
          x: next.x - prev.x,
          y: next.y - prev.y,
        };
        const dLine = Math.sqrt(line.x * line.x + line.y * line.y);

        point.cPrev = {
          x: point.x - (line.x / dLine) * dPrev * this.tension,
          y: point.y - (line.y / dLine) * dPrev * this.tension,
        };
        point.cNext = {
          x: point.x + (line.x / dLine) * dNext * this.tension,
          y: point.y + (line.y / dLine) * dNext * this.tension,
        };
      }
    }
  }

  animate() {
    this.raf(() => {
      this.update();
      this.draw();
      this.animate();
    });
  }

  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
      const layer = this.layers[layerIndex];
      if (layerIndex === 1) {
        if (this.touches.length > 0) {
          const gx = this.touches[0].x;
          const gy = this.touches[0].y;
          layer.color = this.context.createRadialGradient(gx, gy, this.height * 2, gx, gy, 0);
          layer.color.addColorStop(0, this.color2);
          layer.color.addColorStop(1, this.color3);
        } else {
          layer.color = this.color2;
        }
      } else {
        layer.color = this.color1;
      }
      const points = layer.points;
      this.context.fillStyle = layer.color;

      this.context.beginPath();
      this.context.moveTo(points[0].x, points[0].y);
      for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
        this.context.bezierCurveTo(
          points[(pointIndex + 0) % points.length].cNext.x,
          points[(pointIndex + 0) % points.length].cNext.y,
          points[(pointIndex + 1) % points.length].cPrev.x,
          points[(pointIndex + 1) % points.length].cPrev.y,
          points[(pointIndex + 1) % points.length].x,
          points[(pointIndex + 1) % points.length].y
        );
      }
      this.context.fill();
    }
    this.context.fillStyle = this.textColor;
    // this.context.font = '100 ' + (this.height - this.padding * 2) + 'px ' + this.fontFamily;
    this.context.font = this.font;
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.text
    // this.context.fillText(this.text, this.canvas.width / 2, this.canvas.height / 2, this.width - this.padding);
    if (this.debug) {
      this.drawDebug();
    }
  }

  drawDebug() {
    this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
      const layer = this.layers[layerIndex];
      const points = layer.points;
      for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
        if (layerIndex === 0) {
          this.context.fillStyle = this.color1;
        } else {
          this.context.fillStyle = this.color2;
        }
        const point = points[pointIndex];
        this.context.fillRect(point.x, point.y, 1, 1);
        this.context.fillStyle = '#000';
        this.context.fillRect(point.cPrev.x, point.cPrev.y, 1, 1);
        this.context.fillRect(point.cNext.x, point.cNext.y, 1, 1);
        this.context.strokeStyle = 'rgba(0, 0, 0, 0.33)';
        this.context.strokeWidth = 0.5;
        this.context.beginPath();
        this.context.moveTo(point.cPrev.x, point.cPrev.y);
        this.context.lineTo(point.cNext.x, point.cNext.y);
        this.context.stroke();
      }
    }
  }

  createPoint(x, y) {
    return {
      x: x,
      y: y,
      ox: x,
      oy: y,
      vx: 0,
      vy: 0,
    };
  }

  initOrigins() {
    this.canvas.width = this.width + this.margin * 2;
    this.canvas.height = this.height + this.margin * 2;
    for (let layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
      const layer = this.layers[layerIndex];
      const points = [];
      for (let x = ~~(this.height / 2); x < this.width - ~~(this.height / 2); x += this.gap) {
        points.push(this.createPoint(
          x + this.margin,
          this.margin
        ));
      }
      for (let alpha = ~~(this.height * 1.25); alpha >= 0; alpha -= this.gap) {
        const angle = (Math.PI / ~~(this.height * 1.25)) * alpha;
        points.push(this.createPoint(
          Math.sin(angle) * this.height / 2 + this.margin + this.width - this.height / 2,
          Math.cos(angle) * this.height / 2 + this.margin + this.height / 2
        ));
      }
      for (let x = this.width - ~~(this.height / 2) - 1; x >= ~~(this.height / 2); x -= this.gap) {
        points.push(this.createPoint(
          x + this.margin,
          this.margin + this.height
        ));
      }
      for (let alpha = 0; alpha <= ~~(this.height * 1.25); alpha += this.gap) {
        const angle = (Math.PI / ~~(this.height * 1.25)) * alpha;
        points.push(this.createPoint(
          (this.height - Math.sin(angle) * this.height / 2) + this.margin - this.height / 2,
          Math.cos(angle) * this.height / 2 + this.margin + this.height / 2
        ));
      }
      layer.points = points;
    }
  }
}
