/*
todo: make ball roll visually, rotate about axis w/ velocity (axis will be cross product of velocity vector and [0,1,0])
*/

function Ball(pos){
    this.pos = pos;
    this.gravity = 50;

    this.dir = [0,0,1];

    this.yFriction = 0.3;
    this.xFriction = 0.5;

    this.velocity = [0,0,0];
    this.size = 3;

    this.onGround = () => {
        return de(plus(this.pos, [0, -this.size, 0])) < 0.2;
    }

    this.update = () => {
        if(de(this.pos) <= this.size){
            this.velocity = times(reflect(this.velocity, deNormal(this.pos)), 1);
            this.velocity[1] *= 1-this.yFriction;
        }

        while(de(this.pos) < this.size){
            //this.pos = plus(this.pos, times(norm,-(de(this.pos) - this.body2)));
            this.pos = plus(this.pos, times(deNormal(this.pos), -(de(this.pos) - this.size)));
        }

        if(this.onGround() && abs(this.velocity[1]) < 0.5){
            this.velocity[1] = 0;
            this.velocity[0] *= 1-this.xFriction*dt;
            this.velocity[2] *= 1-this.xFriction*dt;
        } else {
            this.velocity = plus(this.velocity, [0, -this.gravity * dt, 0]);
        }
        this.pos = plus(this.pos, times(this.velocity, dt));

        this.updateUniforms();
    }

    this.updateUniforms = () => {
        renderer.setUni("ballPos", this.pos);
    }

    this.de = (p) => {
        return len(plus(p, times(this.pos, -1))) - this.size;
    }
}

let ball = new Ball([0, 10, 0]);