import Matter from 'matter-js'
import { degrees, radians } from 'radians'
import random from 'random'
import * as PIXI from 'pixi.js'
import { width, height } from './config'
import './style.scss'


window.start = () => {

	// PIXI js
	let app = new PIXI.Application({
		width: width, height: height
	})
	document.body.appendChild(app.view)
	app.view.id = 'pixijs'

	// Matter js
  let Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  MouseConstraint = Matter.MouseConstraint,
  Mouse = Matter.Mouse,
  World = Matter.World,
	Constraint = Matter.Constraint,
	Composite = Matter.Composite,
  Bodies = Matter.Bodies,
	Body = Matter.Body,
	Events = Matter.Events;

	// create engine
	let engine = Engine.create()
	let world = engine.world
	let runner = Runner.create()
	let renderer = Render.create({
		element: document.body,
		engine: engine,
		options: {
			width: width,
			height: height,
			pixelRatio: 1,
			background: '#222',
			wireframeBackground: '#222',
			enabled: true,
			wireframes: true,
			showVelocity: true,
			showAngleIndicator: true,
			showCollisions: true
		}
	})
	renderer.canvas.id = 'matterjs'
	renderer.canvas.style.opacity = .5
	// run physics
	Render.run(renderer)
	Runner.run(runner, engine)

	// keys
	var keys = [];
	document.body.addEventListener("keydown", function(e) {
  	keys[e.keyCode] = true
	})
	document.body.addEventListener("keyup", function(e) {
  	keys[e.keyCode] = false
	})

	const checkGround = (e, bool) => {
		let pairs = e.pairs
		for (let i = 0, j = pairs.length; i != j; ++i) {
			let pair = pairs[i]
			if (pair.bodyA === player &&
					pair.bodyB.label.indexOf('wall') == -1) {
				player.ground = bool
			} else if (pair.bodyB === player &&
								 pair.bodyA.label.indexOf('wall') == -1) {
				player.ground = bool
			}
		}
	}

	const checkWall = (e, bool) => {
		let pairs = e.pairs
		for (let i = 0, j = pairs.length; i != j; ++i) {
			let pair = pairs[i]
			if (pair.bodyA === player && pair.bodyB.label.indexOf('wall') > -1) {
					player.touchingWall = bool
				} else if (pair.bodyB === player && pair.bodyA.label.indexOf('wall') > -1) {
						player.touchingWall = bool
				}
		}
	}

	const checkPlatform = (e, bool) => {
		let pairs = e.pairs
		function checkAbovePlatform(plat) {
			if (player.position.y + playerProps.radius - 1 < plat.bounds.min.y) {
				player.ground = bool
			} else {
				player.ground = false
			}
		}
		for (let i = 0, j = pairs.length; i != j; ++i) {
			let pair = pairs[i]
			let plat
			if (pair.bodyA === player && pair.bodyB.label.indexOf('platform') > -1) {
				plat = pair.bodyB
				checkAbovePlatform(plat)
			} else if (pair.bodyB === player && pair.bodyA.label.indexOf('platform') > -1) {
				plat = pair.bodyA
				checkAbovePlatform(plat)
			}
		}
	}

	const checkSidePlatform  = (e) => {
		let pairs = e.pairs
		function checkForSideOfPlatform(plat) {
			if (player.position.x < plat.bounds.min.x || player.position.x > plat.bounds.max.x) {
				console.log(player.position.x, plat.bounds.min.x)
				player.touchingSideOfPlatform = true
			} else {
				player.touchingSideOfPlatform = false
			}
		}
		for (let i = 0, j = pairs.length; i != j; ++i) {
			let pair = pairs[i]
			let plat
			if (pair.bodyA === player && pair.bodyB.label.indexOf('platform') > -1) {
				plat = pair.bodyB
				checkForSideOfPlatform(plat)
			} else if (pair.bodyB === player && pair.bodyA.label.indexOf('platform') > -1) {
				plat = pair.bodyA
				checkForSideOfPlatform(plat)
			}
		}
	}

	// describe bodies
	let playerProps = {
		radius: 25,
		jumpForce: -.1,
		defaultVelocity: .2,
		// defaultInertia: 2407.040215928269,
		velocity: .2,
		inAirMovementSpeed: 3,
		movementSpeed: 6,
		acceleration: 0
	}
	// let dude = Bodies.rectangle(100, 0, dudeProps.width, dudeProps.height)
	let player = Bodies.circle(100, 0, playerProps.radius, {
		density: .001,
		friction: .5,
		frictionStatic: 0,
		frictionAir: .01,
		restitution: 0,
		ground: false,
		touchingWall: false,
		touchingSideOfPlatform: false,
		inertia: Infinity
	})
	// at start, checks for collisions for player
	Events.on(engine, 'collisionStart', e => {
		checkGround(e, true)
		checkWall(e, true)
		checkPlatform(e, true)
		checkSidePlatform(e)
	})
	// Event: ongoing checks for collisions for player
	Events.on(engine, 'collisionActive', e => {
		checkGround(e, true)
		checkWall(e, true)
		checkPlatform(e, true)
		checkSidePlatform(e)
	})
	// at end of a collision, set ground to false
	Events.on(engine, 'collisionEnd', e => {
		checkGround(e, false)
		checkWall(e, false)
		checkPlatform(e, false)
		checkSidePlatform(e)
	})
	// main engine update loop
	Events.on(engine, 'beforeTick', e => {

		// if (keys[32]) console.log(player)
		// jump key
		if (keys[38] && player.ground) {
			player.force = { x: 0, y: playerProps.jumpForce }
		}

		if (keys[37] || keys[39]) {
			if (playerProps.acceleration < playerProps.movementSpeed) {
				playerProps.acceleration += 0.5
			}
		} else {
			playerProps.acceleration = 0
		}

		if (keys[37]) {
			if (player.ground) {
				Body.translate(player, { x: -playerProps.acceleration, y: 0 })
			} else {
				Body.translate(player, { x: -playerProps.inAirMovementSpeed, y: 0 })
			}
		} else {
			if (keys[39]) {
				if (player.ground) {
					Body.translate(player, { x: playerProps.acceleration, y: 0 })
				} else {
					Body.translate(player, { x: playerProps.inAirMovementSpeed, y: 0 })
				}
			}
		}

		if ((player.touchingWall || player.touchingSideOfPlatform) && !player.ground) {
			player.friction = 0
		} else {
			player.friction = .5
		}

	})

	const makePlatform = (type, x, y) => {
		let plat = Bodies.rectangle(x + 100, y + 25, 200, 50, { isStatic: true })
		plat.label = 'platform' + Matter.Composite.allBodies.length
		console.log(plat)
		if (type == 1) { return plat }
	}

	let ground = Bodies.rectangle(width/2, height + 50, width, 200, { isStatic: true })
	ground.label = 'ground'
	let wallLeft = Bodies.rectangle(0, height, -50, -height*2, { isStatic: true })
	wallLeft.label = 'wall1'
	// console.log(player.inertia)
	// some platforms
	let platform1 = makePlatform(1, 150, 300)
	let platform2 = makePlatform(1, 450, 150)


	// add bodies
	World.add(world, [
		player,
		ground, wallLeft,
		platform1, platform2
	])

	// fit the render viewport to the scene
	Render.lookAt(renderer, {
		min: { x: 0, y: 0 },
		max: { x: width, y: height }
	})

	function render() { // custom render()
	}
	// render()

  // context for MatterTools.Demo
  return {
    engine: engine,
    runner: runner,
    render: renderer,
    canvas: renderer.canvas,
    stop: () => {
      Matter.Render.stop(renderer)
      Matter.Runner.stop(runner)
    }
  }

}
