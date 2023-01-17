// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

class GameEngine {
    constructor(options) {
        this.ctx = null;
        this.camera = null;
        this.currentFrame = 0; // Used to track time globablly

        // Everything that will be updated and drawn each frame
        this.entities = [];

         //for Gamepad
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;
        this.A = false;
        this.B = false;
        this.gamepad = null;
       
        // Information on the input
        this.click = null;
        this.mouse = null;
        this.wheel = null;
        this.keys = {};

        // Options and the Details
        this.options = options || {
            debugging: false,
        };
    };

    init(ctx) {
        this.ctx = ctx;
        this.startInput();
        this.timer = new Timer();
        this.camera = new SceneManager(this);
        this.entities.push(this.camera);
    };

    start() {
        this.running = true;
        const gameLoop = () => {
            this.loop();
            requestAnimFrame(gameLoop, this.ctx.canvas);
        };
        gameLoop();
    };

    startInput() {
        const getXandY = e => ({
            x: e.clientX - this.ctx.canvas.getBoundingClientRect().left,
            y: e.clientY - this.ctx.canvas.getBoundingClientRect().top
        });
        
        this.ctx.canvas.addEventListener("mousemove", e => {
            if (this.options.debugging) {
                console.log("MOUSE_MOVE", getXandY(e));
            }
            this.mouse = getXandY(e);
        });

        this.ctx.canvas.addEventListener("click", e => {
            if (this.options.debugging) {
                console.log("CLICK", getXandY(e));
            }
            this.click = getXandY(e);
        });

        this.ctx.canvas.addEventListener("wheel", e => {
            if (this.options.debugging) {
                console.log("WHEEL", getXandY(e), e.wheelDelta);
            }
            e.preventDefault(); // Prevent Scrolling
            this.wheel = e;
        });

        this.ctx.canvas.addEventListener("contextmenu", e => {
            if (this.options.debugging) {
                console.log("RIGHT_CLICK", getXandY(e));
            }
            e.preventDefault(); // Prevent Context Menu
            this.rightclick = getXandY(e);
        });

       //declares keyboard active and listens for keyboard events
       this.ctx.canvas.addEventListener("keydown", event => {this.keyboardActive = true; this.keys[event.key] = true;});
       this.ctx.canvas.addEventListener("keyup", event => {this.keyboardActive = false; this.keys[event.key] = false});
    };

    addEntity(entity) {
        if (entity instanceof Slime) this.slime = entity;
        this.entities.push(entity);
    };

    draw() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height); // Clear canvas

        for (let i = this.entities.length - 1; i >= 0; i--) {
            this.entities[i].draw(this.ctx, this);
        }

        this.camera.draw(this.ctx); 
    };

    /**
     * Tracks the current state of the gamepad every tick.
     */
    gamepadUpdate() {
        this.gamepad = navigator.getGamepads()[0];
        let gamepad = this.gamepad;
        if (gamepad != null && !this.keyboardActive) {
            this.A = gamepad.buttons[0].pressed;
            this.B = gamepad.buttons[1].pressed;
            //checks if d-pad is used or joysticks meet a certain threshold
            this.left = gamepad.buttons[14].pressed || gamepad.axes[0] < -0.3;
            this.right = gamepad.buttons[15].pressed || gamepad.axes[0] > 0.3;
            this.up = gamepad.buttons[12].pressed || gamepad.axes[1] < -0.3;
            this.down = gamepad.buttons[13].pressed || gamepad.axes [1] > 0.3;
        }
    }

    update() {
        this.totalEntities = this.entities.length;

        for (let i = 0; i < this.totalEntities; i++) {
            let entity = this.entities[i];

            if (!entity.removeFromWorld) {
                entity.update();
            }
        }

        for (let i = this.entities.length - 1; i >= 0; --i) {
            if (this.entities[i].removeFromWorld) {
                this.entities.splice(i, 1);
            }
        }
    };

    loop() {
        this.clockTick = this.timer.tick();
        this.update();
        this.gamepadUpdate();
        this.draw();
        this.currentFrame++;
    };

    // Utilities

    clamp (num, min, max) {
        return Math.min(Math.max(num, min), max);
    }

};

// KV Le was here :)