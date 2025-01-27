var w = window.innerWidth,
  h = window.innerHeight;

var game = new Phaser.Game(w, h, Phaser.AUTO, "game", {
  preload: preload,
  create: create,
  update: update,
  render: render,
});

var fruits = [
  "apple",
  "banana",
  "cherry",
  "dragon-fruit",
  "orange",
  "pineapple",
  "pumpkin",
  "strawberry",
];

function preload() {
  fruits.forEach((fruit) =>
    game.load.image(fruit, `images/fruits/${fruit}.png`)
  );
  game.load.image("explosion", "images/explosion.png");
}

var good_objects,
  slashes,
  line,
  tipLabel,
  scoreLabel,
  chromeLabel,
  fontSize,
  fruitSize,
  score = 0,
  points = [];

var fireRate = 1400;
var nextFire = 0;
var scoreToWin = 10;

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.physics.arcade.gravity.y = 300;
  game.stage.backgroundColor = "#0d2622";

  good_objects = createGroup(fruits);

  slashes = game.add.graphics(0, 0);

  emitter = game.add.emitter(0, 0, 300);
  emitter.makeParticles("explosion");
  emitter.gravity = 300;
  emitter.setScale(0.15, 0.3, 0.15, 0.3);
  emitter.setYSpeed(-400, 400);

  fontSize = game.world.width < 500 ? 24 : 40;
  fruitSize = Math.round(Math.min(game.world.width, game.world.height) * 0.25);

  createText();

  throwObject();
}

function createText() {
  tipLabel = game.add.text(10, 10, "Slice fruits!");
  tipLabel.fill = "white";
  tipLabel.fontSize = fontSize;
}

function createGroup(sprites) {
  var group = game.add.group();
  group.enableBody = true;
  group.physicsBodyType = Phaser.Physics.ARCADE;
  sprites.forEach((sprite) => {
    group.add(game.make.sprite(30000, 30000, sprite));
  });
  group.setAll("checkWorldBounds", true);
  group.setAll("outOfBoundsKill", true);
  return group;
}

function createGroupMultiple(numItems, sprite) {
  var group = game.add.group();
  group.enableBody = true;
  group.physicsBodyType = Phaser.Physics.ARCADE;
  group.createMultiple(numItems, sprite);
  group.setAll("checkWorldBounds", true);
  group.setAll("outOfBoundsKill", true);
  return group;
}

function throwObject() {
  if (
    game.time.now > nextFire &&
    good_objects.countDead() > 0 
  ) {
    nextFire = game.time.now + fireRate;
    throwGoodObject();
  }
}

function throwGoodObject() {
  var obj = getRandomDead(good_objects);
  obj.reset(getRandomX(), game.world.height);
  obj.anchor.setTo(0.5, 0.5);
  obj.angle = getRandomStartingAngle();
  obj.height = obj.width = fruitSize;
  obj.body.angularAcceleration = getRandomAngularAcceleration();
  game.physics.arcade.moveToXY(
    obj,
    game.world.centerX,
    game.world.centerY,
    getRandomSpeed()
  );
}

function getRandomDead(group) {
  let deadChildren = group.children.filter(function (e) {
    return !e.alive;
  });
  let randIndex = Math.floor(Math.random() * deadChildren.length);
  randIndex = Math.min(randIndex, deadChildren.length - 1);
  return deadChildren[randIndex];
}

// get random value between -50 and 50
function getRandomAngularAcceleration() {
  return (Math.random() * 2 - 1) * 50;
}

// get random angle between -10 and 10
function getRandomStartingAngle() {
  return (Math.random() * 2 - 1) * 10;
}

// get random x position from the central 60% of the screen
function getRandomX() {
  return (
    (Math.random() * game.world.width - game.world.centerX) * 0.6 +
    game.world.centerX
  );
}

// get random value from 0 and screen's height, up to max 500
function getRandomSpeed() {
  return Math.max(Math.random() * game.world.height, 500);
}

function getInput() {
  return game.input;
}

function update() {
  throwObject();

  let input = getInput();
  points.push({
    x: input.x,
    y: input.y,
  });
  points = points.splice(points.length - 10, points.length);

  if (points.length < 1 || points[0].x == 0) {
    return;
  }

  slashes.clear();
  slashes.beginFill(0xffffff);
  slashes.alpha = 0.5;
  slashes.moveTo(points[0].x, points[0].y);
  for (var i = 1; i < points.length; i++) {
    slashes.lineTo(points[i].x, points[i].y);
  }
  slashes.endFill();

  for (var i = 1; i < points.length; i++) {
    line = new Phaser.Line(
      points[i].x,
      points[i].y,
      points[i - 1].x,
      points[i - 1].y
    );
    game.debug.geom(line);

    good_objects.forEachExists(checkIntersects);
  }
}

var contactPoint = new Phaser.Point(0, 0);

function checkIntersects(fruit, callback) {
  var l1 = new Phaser.Line(
    fruit.body.right - fruit.width,
    fruit.body.bottom - fruit.height,
    fruit.body.right,
    fruit.body.bottom
  );
  var l2 = new Phaser.Line(
    fruit.body.right - fruit.width,
    fruit.body.bottom,
    fruit.body.right,
    fruit.body.bottom - fruit.height
  );
  l2.angle = 90;

  if (
    Phaser.Line.intersects(line, l1, true) ||
    Phaser.Line.intersects(line, l2, true)
  ) {
    let input = getInput();
    contactPoint.x = input.x;
    contactPoint.y = input.y;
    var distance = Phaser.Point.distance(
      contactPoint,
      new Phaser.Point(fruit.x, fruit.y)
    );
    if (
      Phaser.Point.distance(contactPoint, new Phaser.Point(fruit.x, fruit.y)) >
      110
    ) {
      return;
    }

    if (fruit.parent == good_objects) {
      killFruit(fruit);
    } 
  }
}

function killFruit(fruit) {
  emitter.x = fruit.x;
  emitter.y = fruit.y;
  emitter.start(true, 2000, null, 4);
  fruit.kill();
  points = [];
}

function render() {}
