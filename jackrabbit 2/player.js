let mouseDown = [];
let mousePressed = [];
let keyDown = [];
let keyPressed = [];

onmousemove = (e) => {
    let sens = [1/900, 1/900];
    player.angle[0] += e.movementX * sens[0];
    player.angle[1] -= e.movementY * sens[1];

    if(player.angle[1] >= Math.PI/2){
        player.angle[1] = Math.PI/2;
    }
    if(player.angle[1] <= -Math.PI/2){
        player.angle[1] = -Math.PI/2;
    }
}

onmousedown = (e) => {
    mouseDown[e.button] = true;
    mousePressed[e.button] = true;
}

onmouseup = (e) => {
    mouseDown[e.button] = false;
}

onkeydown = (e) => {
    keyDown[e.key.toLowerCase()] = true;
    keyPressed[e.key.toLowerCase()] = true;
}

onkeyup = (e) => {
    keyDown[e.key.toLowerCase()] = false;
}

function Player(){
    this.pos = [0,1.5,0];

    this.camPos = [0,0,0];

    this.angle = [0,0];

    this.bodyAngle = [0,0];

    this.gravity = 50;
    this.jumpVel = 15;
    this.terminalYVel = 30;
    this.speed = 7.5;

    this.velocity = [0,0,0];
    this.jumpSpeed = 50;
    this.xFriction = 0.5;
    
    this.coyoteTime = 0.1;
    
    let height = 1.5;
    let feetLength = 0.375;

    this.feetRad = 0.1;
    this.feetCloseRad = 0.2;
    this.bodyRad = 0.7;

    this.body2 = 0.5;

    this.kickState = false;
    this.kickPos = undefined;
    this.kickPower = 50; //going to make kick more powerful w/ longer hold? idk controls but power should be a control

    this.FeetPts = [
        [0, -height, 0],
        [feetLength, -height, feetLength],
        [-feetLength, -height, feetLength],
        [feetLength, -height, -feetLength],
        [-feetLength, -height, -feetLength]
    ];
    this.feetPts = [];

    this.BodyPts = [
        [0, 0, 0],
        [0, -height/3, 0]
    ];
    this.bodyPts = [];

    this.updatePts = () => {
        this.feetPts = [];
        this.bodyPts = [];

        for(let i of this.FeetPts){
            this.feetPts.push(plus(this.pos, i));
        }
        
        for(let i of this.BodyPts){
            this.bodyPts.push(plus(this.pos, i));
        }
    }
    
    this.update = () => {
        this.kick();
        this.jump();
        this.move();

        this.updateUniforms();
        this.updatePts();
    }

    this.jump = () => {
        if(mouseDown[2] && this.coyoteTime > 0){
            this.coyoteTime = -1;
            let upOffset = [0, 0.5, 0];
            let dir = dirFromAngle(...this.angle);

            dir = normalize(plus(dir, upOffset));
            dir[0] /= 2;
            dir[2] /= 2;
            this.velocity = times(dir, this.jumpSpeed);
        }
    }

    this.kick = () => {
        let kickRange = 7;
        if(mouseDown[0] && ball.de(this.pos) < kickRange){
            this.kickState = true;
            dt /= 10;
            let dir = dirFromAngle(...this.angle);
            let p = this.camPos;
            let marchRes = march(ball.de, p, dir);
            if(marchRes){
                this.kickPos = marchRes;
            } else {
                this.kickPos = undefined;
            }

        } else if(this.kickState){
            this.kickState = false;
            if(this.kickPos != undefined){
                let upOffset = [0, -1, 0];
                let kickDir = normalize(plus(ball.pos, times(plus(this.kickPos, upOffset), -1)));
                ball.velocity = times(kickDir, this.kickPower);
            }
        }
    }

    this.move = () => {
        let vel = [0,0,0];

        if(keyDown["w"]){
            vel[2] += cos(this.angle[0]);
            vel[0] += sin(this.angle[0]);
        }
        if(keyDown["s"]){
            vel[2] -= cos(this.angle[0]);
            vel[0] -= sin(this.angle[0]);
        }
        if(keyDown["a"]){
            vel[2] += sin(this.angle[0]);
            vel[0] -= cos(this.angle[0]);
        }
        if(keyDown["d"]){
            vel[2] -= sin(this.angle[0]);
            vel[0] += cos(this.angle[0]);
        }

        if(len(vel) > 0){
            while(abs(this.bodyAngle[0] - Math.atan2(vel[0], vel[2])) >= Math.PI){
                this.bodyAngle[0] += Math.sign(Math.atan2(vel[0], vel[2])-this.bodyAngle[0])*Math.PI;
            }
            this.bodyAngle[0] = lerp(this.bodyAngle[0], Math.atan2(vel[0], vel[2]), 0.3);
            renderer.setUni("playerAngle", [this.bodyAngle[0], 0]);
        }

        if(len(vel) == 0){
            vel = [0, 0, 0];
        } else {
            vel = times(vel, this.speed*dt/len(vel));
        }

        this.coyoteTime -= dt;

        if(this.onGround()){
            this.coyoteTime = 0.2;
            this.velocity[0] *= 0;
            this.velocity[2] *= 0;
        }

        if(keyPressed[" "] && this.coyoteTime > 0){
            this.velocity[1] = this.jumpVel;
            this.coyoteTime = -1;
        }
        
        this.velocity[1] -= this.gravity*dt;
        vel = plus(times(this.velocity, dt), vel);

        this.pos = plus(vel, this.pos);

        while(de(this.pos) < this.body2){
            let norm = deNormal(this.pos);
            this.pos = plus(this.pos, times(norm,-(de(this.pos) - this.body2)));
            this.velocity = plus(this.velocity, times(norm,-dot(this.velocity, norm)));
        }
    }

    this.onGround = () => {
        return de(plus(this.pos, [0,-this.body2,0])) < 0.1;
    }

    this.feetDist = () => {
        let dists = [];
        for(let i of this.feetPts){
            dists.push(de(i));
        }
        return min(...dists);
    }

    this.bodyDist = () => {
        let dists = [];
        for(let i of this.bodyPts){
            dists.push(de(i));
        }

        return min(...dists);
    }

    this.updateUniforms = () => {
        renderer.setUni("playerPos", this.pos);
        renderer.setUni("camAngle", this.angle);

        let camDir = [0, 0, -5];

        camDir = rotX(camDir, -this.angle[1]);

        camDir = rotY(camDir, this.angle[0]);

        let camPos = plus(plus(this.pos, [0,1,0]), camDir);

        let iterations = 1000;

        while(de(camPos) < 0.5 && iterations > 0){
            iterations--;
            camPos = plus(camPos, times(camDir, -0.005/5));
        }

        renderer.setUni("camPos", camPos);
        this.camPos = camPos;
    }

    this.updatePts();
}

let player = new Player();