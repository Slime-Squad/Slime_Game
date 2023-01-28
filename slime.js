/**
 * Class representation of a playable Slime entity
 * @author Xavier Hines, Nathan Brown, @author Jasper Newkirk
 */
class Slime extends AnimatedEntity {
    /**
     * Creates a new instance of a playable slime entity.
     * @param {string} tag The name of the current animation of the slime
     * @param {number} x The x-coordinate associated with the top-left corner of the slime's sprite on the canvas.
     * @param {number} y The y-coordinate associated with the top-left corner of the slime's sprite on the canvas.
     */
    constructor(tag, x, y) {
        super("./assets/graphics/characters/slimeBounce", tag, x, y);
        Object.assign(this, {tag, x, y});
        this.hitbox = new HitBox(x, y, 12*PARAMS.SCALE, 12*PARAMS.SCALE);
        
        // Movement
        this.speed = 2 * PARAMS.SCALE;
        this.dashSpeed = 16;
        this.momentum = 0;
        this.acceleration = this.speed / 45;
        this.decceleration = this.speed / 30;
        this.direction = 1;
        this.rise = -1;
        this.bounce = 4 * PARAMS.SCALE;
        this.gravity = .685;

        // Conditions
        this.canJump = true;
        this.canDash = true;
        this.isAirborne = true;
        this.isAnitgrav = false;
        this.lastX = this.x;
        this.lastY = this.y;

        // Charges
        this.charges = {
            "Electric" : 0,
            "Fire" : 0,
            "Ice" : 0,
            "Earth" : 0
        }

        // Timers
        this.jumpTimer = 0;
        this.dashTimer = 0;
        this.currentDashTime = 0;
    
    };

    /**
     * Function called on every clock tick.
     */
    update() {
        
        // CONTROLS
        
        // Up and Down
        // if(GAME.keys["w"] || GAME.up) {
        //     this.y -= this.speed * TICKMOD;
        // }
        // if(GAME.keys["s"] || GAME.down) {
        //     this.y += this.speed * TICKMOD;
        // }

        const TICKMOD = GAME.clockTick * 60;
        const MAXMOM = this.speed / 1.5;
        
        // Left and Right
        if(GAME.keys["a"] || GAME.left) {
            if (this.momentum > 0) this.momentum /= 2;
            this.x += (this.speed * -1 + this.momentum) * TICKMOD;
            this.tag = "move_left";
            this.direction = -1;
            this.momentum = clamp(
                this.momentum - this.acceleration * TICKMOD,
                MAXMOM * -1,
                MAXMOM
            );
        }
        else if(GAME.keys["d"] || GAME.right) {
            if (this.momentum < 0) this.momentum /= 2;
            this.x += (this.speed + this.momentum) * TICKMOD;
            this.tag = "move";
            this.direction = 1;
            this.momentum = clamp(
                this.momentum * TICKMOD + this.acceleration * TICKMOD,
                MAXMOM * -1,
                MAXMOM
            );
        } else {
            this.x += this.momentum * TICKMOD;
            this.tag = this.direction > 0 ? "idle" : "idle_left";
            this.momentum = this.direction > 0 ?
                clamp(this.momentum - this.decceleration * TICKMOD, 0, MAXMOM) :
                clamp(this.momentum + this.decceleration * TICKMOD, MAXMOM * -1, 0);
        }

        // Jump
        //this.canJump = true; // Allow Midair for Debugging
        if((GAME.keys[" "] || GAME.A) && this.canJump) {
            this.canJump = false;
            // console.log("jump");
            this.jumpTimer = 0;
            this.rise = this.bounce + (this.momentum / 2) * this.direction;
            this.isAirborne = true;
        }
        this.jumpTimer += GAME.clockTick;

        // Dash
        if((GAME.keys["j"] || GAME.B) && this.canDash) {
            this.canDash = false;
            console.log("smash");
            this.dashTimer = 120;
            this.currentDashTime = 0;
        }
        if (!this.canDash) this.currentDashTime += TICKMOD; 
        if (!this.canDash && (this.currentDashTime>= this.dashTimer - 1)) this.canDash = true;
        if (!this.canDash && this.currentDashTime < 15 ) {
            if(PARAMS.GAME.keys["a"]) this.x -= this.dashSpeed * TICKMOD;
            if(PARAMS.GAME.keys["d"]) this.x += this.dashSpeed * TICKMOD;
        }

        // Rise
        this.y -= this.rise * TICKMOD;
        if (this.rise < -1.5 * PARAMS.SCALE){
            this.canJump = false;
        }

        // Gravity
        if (this.rise > -6 * PARAMS.SCALE){
            this.rise -= this.gravity * TICKMOD;
        }

        // HANDLE COLLISIONS
        this.hitbox.updatePos(this.x+(2*PARAMS.SCALE), this.y+(4*PARAMS.SCALE));
        let xDiff = this.lastX - this.x;
        let yDiff = this.lastY - this.y;
        let totalCollisions = 0;
        GAME.entities.forEach(entity => {
            if (!entity.hitbox) return;
            if (entity instanceof Slime) return;
            let collision = this.hitbox.collide2(entity.hitbox);
            if (!collision) return;
            totalCollisions++;
            switch (entity.constructor.name){
                case 'Charge':
                    if (entity.tag != "Disabled") { // charge collected
                        entity.tag = "Disabled";
                    }
                    break;
                case 'Tile':
                    if (Math.abs(xDiff) > 20 || Math.abs(yDiff) > 20){
                        // console.log(collision.direction);
                        // console.log("xDiff: " + xDiff);
                        // console.log("yDiff: " + yDiff);
                    }
                    if (collision.direction === 'left'){
                    // if (collision.direction === 'left' && collision.leftIntersect > 0){
                        // console.log("left_isct: " + collision.leftIntersect);
                        this.x = this.x + (collision.leftIntersect);
                    } else if (collision.direction === 'right'){
                        this.x = this.x + (collision.rightIntersect);
                    } else if (collision.direction ==='top'){
                        this.y = this.y + (collision.topIntersect);
                    } else {
                        this.y = this.y + (collision.bottomIntersect);
                        this.isAirborne = true;
                        if (GAME.currentFrame - this.jumpTimer > 15) this.canJump = true;
        }
                    this.hitbox.updatePos(this.x+(2*PARAMS.SCALE), this.y+(4*PARAMS.SCALE));
                    break;
            }
        });

        if (totalCollisions > 5){
            console.log("collisions: " + totalCollisions);
            this.x = this.lastX;
            this.y = this.lastY;
        }

        if (Math.abs(xDiff) > 32 || Math.abs(yDiff) > 32){
            console.log("xDiff: " + xDiff);
            console.log("yDiff: " + yDiff);
        }

        // Reset momentum on stop
        if (this.x == this.lastX){
            this.momentum *= .2;
        }

        // Reset rise on stop
        if (this.y == this.lastY){
            this.rise *= .2;
        }

        // Update previous pos markers
        this.lastX = this.x;
        this.lastY = this.y;

    }

    /**
     * Draws the current slime's {@link Slime.tag} animation. Called on every clock tick.
     * @param {CanvasRenderingContext2D} ctx The canvas which the slime will be drawn on.
     */
    draw(ctx) {
        super.draw(ctx);
        if (PARAMS.DEBUG) {
            ctx.font = "30px segoe ui";
            ctx.fillStyle = "red";
            // ctx.fillText("Rise:" + Math.round(this.rise), this.x - GAME.camera.x, this.y - GAME.camera.y - 50);
            // ctx.fillText("Momentum:" + Math.round(this.momentum), this.x - GAME.camera.x, this.y - GAME.camera.y);
            ctx.fillText("Jump Timer:" + Math.round(this.jumpTimer), this.x - GAME.camera.x, this.y - GAME.camera.y - 50);
    }
}
    
}
