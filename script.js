class Vector {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    set(set) {
        if (typeof set === "object") {
            this.x = set.x;
            this.y = set.y;
        } else {
            this.x = set;
            this.y = set;
        }

        return this;
    }
    equals(v) {
        return ((v.x === this.x) && (v.y === this.y));
    }
    clone() {
        return new Vector(this.x, this.y);
    }
    mul(mul) {
        if (typeof mul === "object") {
            return new Vector(this.x * mul.x, this.y * mul.y);
        } else {
            return new Vector(this.x * mul, this.y * mul);
        }
    }
    div(div) {
        return new Vector(this.x / div, this.y / div);
    }
    add(add) {
        if (typeof add === "object") {
            return new Vector(this.x + add.x, this.y + add.y);
        } else {
            return new Vector(this.x + add, this.y + add);
        }
    }
    sub(sub) {
        if (typeof sub === "object") {
            return new Vector(this.x - sub.x, this.y - sub.y);
        } else {
            return new Vector(this.x - sub, this.y - sub);
        }
    }
    reverse() {
        return this.mul(-1);
    }
    abs() {
        return new Vector(Math.abs(this.x), Math.abs(this.y));
    }
    dot(v) {
        return (this.x * v.x + this.y * v.y);
    }
    length() {
        return Math.sqrt(this.dot(this));
    }
    lengthSq() {
        return this.dot(this);
    }
    setLength(l) {
        return this.normalize().mul(l);
    }
    lerp(v, s) {
        return new Vector(this.x + (v.x - this.x) * s, this.y + (v.y - this.y) * s);
    }
    normalize() {
        return this.div(this.length());
    }
    truncate(max) {
        if (this.length() > max) {
            return this.normalize().mul(max);
        } else {
            return this;
        }
    }
    dist(v) {
        return Math.sqrt(this.distSq(v));
    }
    distSq(v) {
        var dx = this.x - v.x,
            dy = this.y - v.y;
        return dx * dx + dy * dy;
    }
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }
}


class Circle {
    constructor(pos, r) {
        this.pos = pos;
        this.r = r;
        this.count = 0 //collisions this frame
        this.bounciness = 1 //0.5
        var num = Math.round(Math.random() * 255)
        if (num < 16) { num = "0" + num.toString(16) } else { num = num.toString(16) }
        this.colour = "#" + num + "0000";
        this.m = r * r * Math.PI;
        this.v = new Vector(getNum(-5, 5) / 300, getNum(-5, 5) / 300);
        this.v.set(0)
        this.a = new Vector();
        this.id = particles.length
        particles.push(this)
    }
    timeToHit(that) {
        if (this.id == that.id) return Infinity;
        var dp = that.pos.sub(this.pos);
        var dv = that.v.sub(this.v);
        var dpdv = dp.dot(dv);

        if (dpdv > 0) { return Infinity; }
        var dvdv = dv.lengthSq();
        if (dvdv == 0) { return Infinity; }
        var dpdp = dp.lengthSq();
        var srsq = (this.r + that.r) ** 2;
        var d = (dpdv * dpdv) - dvdv * (dpdp - srsq);
        //if (dpdp < srsq){ console.log("overlapping particles")
//this.colour = "Green"
//that.colour = "DarkGreen"
//}
        if (d < 0) return Infinity;
        return -Math.min(dpdv + Math.sqrt(d),0) / dvdv;
    }
    timeToHitXBar() {
        if (this.v.y > 0) {
            return Math.max(boundH - this.pos.y - this.r,0) / this.v.y;
        }
        else if (this.v.y < 0) {
            return -Math.max(this.pos.y - this.r,0) / this.v.y;
        }
        return Infinity
    }
    timeToHitYBar() {
        if (this.v.x > 0) {
            return Math.max(boundW - this.pos.x - this.r,0) / this.v.x;
        }
        else if (this.v.x < 0) {
            return -Math.max(this.pos.x - this.r,0) / this.v.x
        }
        return Infinity
    }
    bounceOffXBar() {
        this.v.y *= -1 * this.bounciness
        predict(this)
    }
    bounceOffYBar() {
        this.v.x *= -1 * this.bounciness
        predict(this)
    }
    draw() {
        ctx.fillStyle = this.colour;

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();
    }
    drawSpeed() {
        ctx.strokeStyle = "Blue";
        ctx.lineWidth = 5

        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + this.v.x * 100, this.pos.y + this.v.y * 100);
        ctx.stroke();
    }
}

function getNum(i, o) { return i + Math.round(Math.random() * (o - i)) }


function checkCCCol(a, b) {
    var d = a.pos.sub(b.pos);
    var r = a.r + b.r;
    return (d.lengthSq() < r * r)
}

function resCCCol(a, b) {
    var d = a.pos.sub(b.pos);
    d.set(d.normalize());
    var v = b.v.sub(a.v);
    var dot = d.dot(v)

    if (dot >= 0) {
        var tm = a.m + b.m;

	var fBounce = a.bounciness * b.bounciness

        var c = d.mul(2 * dot / tm);

        a.v.set(a.v.add(c.mul(b.m*collisionEnergyMultiplier)));
        b.v.set(b.v.sub(c.mul(a.m*collisionEnergyMultiplier)));
        predict(a)
        predict(b)
    }
}


function predict(p) {
    var txbar = p.timeToHitXBar()
    var tybar = p.timeToHitYBar()
    var tother = Infinity
    var curother;
    for (var i2 = 0; i2 < particles.length; i2++) {
        if (particles[i2].id == p.id) { continue }
        var temp = p.timeToHit(particles[i2])
        if (temp < tother) {
            tother = temp
            curother = particles[i2]
        }

    }
    if (ct + txbar < ft && txbar < tybar && txbar < tother) {
        events.push(new XBarEvent(p, ct + txbar))
    } else if (ct + tybar < ft && tybar < tother) {
        events.push(new YBarEvent(p, ct + tybar))
    } else if (ct + tother < ft && curother != undefined) {
        events.push(new CollisionEvent(p, curother, ct + tother))
    }
}

var tick = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
    window.setTimeout(callback, 1000 / 60);
};

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var mouse = {
    p: new Vector()
};

var particles = [];
mdown = false

window.addEventListener("mousedown", function (e) {
    mdown = true
});
window.addEventListener("mousemove", function (e) {
    mouse.p.x = e.pageX - canvas.getBoundingClientRect().left;
    mouse.p.y = e.pageY - canvas.getBoundingClientRect().top;
});
window.addEventListener("mouseup", function (e) {
    mdown = false
});

boundX = 0
boundY = 0
boundW = canvas.width
boundH = canvas.height
ft = 1000 / 60
ct = 0
landgravity = 0.02
particlegravity = 0//0.9
minRadius = 10
maxRadius = 20
collisionEnergyMultiplier = 1
airdrag = 0.95
FPS = 0
previousElapsed = 0

timeElement = document.getElementById("time");
numElement = document.getElementById("num");

timeElement.textContent = "..."
numElement.textContent = "..."

setInterval(function () { timeElement.textContent = FPS.toFixed(0); numElement.textContent = particles.length }, 100)


class CollisionEvent {
    constructor(a, b, time) {
        this.a = a
        this.b = b
        this.acount = a.count
        this.bcount = b.count
        this.time = time
if(time < 0){console.log("Negative Time Ball")}
    }
    resolve() {
        if (this.a.count == this.acount && this.b.count == this.bcount) {
            this.a.count++
            this.b.count++
            physicsStep(this.time - ct)
            resCCCol(this.a, this.b)
        }
    }
}

class XBarEvent {
    constructor(p, time) {
        this.p = p
        this.pcount = p.count
        this.time = time
if(time < 0){console.log("Negative Time XXBAR")}
    }
    resolve() {
        if (this.p.count == this.pcount) {
            this.p.count++
            physicsStep(this.time - ct)
            this.p.bounceOffXBar()
        }
    }
}

class YBarEvent {
    constructor(p, time) {
        this.p = p
        this.pcount = p.count
        this.time = time
if(time < 0){console.log("Negative Time YYBAR")}
    }
    resolve() {
        if (this.p.count == this.pcount) {
            this.p.count++
            physicsStep(this.time - ct)
            this.p.bounceOffYBar()
        }
    }
}


function physicsStep(time) {
    if (time < 0) { return }
    for (var i3 = 0; i3 < particles.length; i3++) {
        var p3 = particles[i3];
        p3.pos.set(p3.pos.add(p3.v.mul(time)));
    }
    ct += time
}

sumtries = 0

function do_physics() {
    compute_forces();
    events = []
    for (var i1 = 0; i1 < particles.length; i1++) {
        var p1 = particles[i1];
        if(particles[i1].v.lengthSq() < 0.0001){
        particles[i1].v.set(0)
        } else {
        predict(p1)
        }
    }
    var tries = 0
    var maxtries = 10000
    while (events.length > 0 && tries < maxtries) {
        tries++
        cid = 0
        for (var i = 0; i < events.length; i++) {
            if (events[i].time < events[cid].time) {
                cid = i
            }
        }

        events[cid].resolve()
        events.splice(cid, 1)
    }
    sumtries = tries
    if (tries == maxtries) { 
console.error("Too many stuff happening. Physics engine can't handle it")
}
     for (var i3 = 0; i3 < particles.length; i3++) {
        var p3 = particles[i3];
        p3.pos.set(p3.pos.add(p3.v.mul(ft - ct)));
    }
}

function compute_forces() {
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.count = 0
        p.v.set(p.v.mul(airdrag))
        p.v.y += landgravity

        for (var j = 0; j < i; j++) {
            var p2 = particles[j];

            var d = p.pos.sub(p2.pos);
            var norm = Math.sqrt(100.0 + d.lengthSq());
            var mag = particlegravity / (norm * norm * norm);

            p.v.set(p.v.sub(d.mul(mag * p2.m)));
            p2.v.set(p2.v.add(d.mul(mag * p.m)));

        }
    }
    //console.log("Total Speed: " + totalSpeed().toFixed(0) + "\nTotal Momentum: " + totalMomentum().toFixed(0) + "\nTotalKineticEnergy: " + totalKineticEnergy().toFixed(0))
}

function totalKineticEnergy() {
    var tot = 0
    for (var i = 0; i < particles.length; i++) {
        tot += 1 / 2 * particles[i].m * particles[i].v.lengthSq()
    }
    return tot
}

function totalSpeed() {
    var tot = 0
    for (var i = 0; i < particles.length; i++) {
        tot += particles[i].v.lengthSq()
    }
    return tot
}

function totalMomentum() {
    var tot = 0
    for (var i = 0; i < particles.length; i++) {
        tot += particles[i].v.mul(particles[i].m).length()
    }
    return tot
}

function update(elapsed) {
    FPS = 1000 / (elapsed - previousElapsed)
    previousElapsed = elapsed
    if (mdown) {
        var randomr = minRadius + Math.round(Math.random() * (maxRadius - minRadius))
        var colliding = false
        for (var i = 0; i < particles.length; i++) {
            if ((mouse.p.x - particles[i].pos.x) ** 2 + (mouse.p.y - particles[i].pos.y) ** 2 < (particles[i].r + randomr) ** 2) {
                colliding = true
            }
        }
        if (!colliding && mouse.p.x - randomr > boundX && mouse.p.y - randomr > boundY && mouse.p.x + randomr < boundW && mouse.p.y + randomr < boundH) {
            var circ = new Circle(mouse.p.clone(), randomr)
        }
    }

    ct = 0
    do_physics()

    ctx.fillStyle = "Gray"
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillRect(0, 0, boundW, boundH);

    for (var i = 0; i < particles.length; i++) {
        particles[i].draw()
    }
    /*for (var i = 0; i < particles.length; i++) {
        particles[i].drawSpeed()
    }*/

    tick(update);
}

update();

//Simultaneous Collision //Incorrect Behaviour
/*
new Circle(new Vector(365,300), 30)
new Circle(new Vector(435,300), 30)
new Circle(new Vector(400,450), 30)
*/

//Newton's Cradle
/*
new Circle(new Vector(300,450), 30)
new Circle(new Vector(360,450), 30)
new Circle(new Vector(420,450), 30)
new Circle(new Vector(480,450), 30)
new Circle(new Vector(540,450), 30)
new Circle(new Vector(600,450), 30)

a = new Circle(new Vector(50,450), 30)
a.v = new Vector(0.2,0)*/


//Corner Collision
new Circle(new Vector(770,450), 30)

a = new Circle(new Vector(50,450), 30)
a.v = new Vector(0.4,0)