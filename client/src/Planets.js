import * as THREE from "three";
import C, { Vec3 } from "cannon";

// Options
const force = 5;

export default class Planets {
  constructor(scene, world, camera, cameraControls) {
    this.$navItems = document.querySelectorAll(".mainNav a");

    this.scene = scene;
    this.world = world;
    this.camera = camera;
    this.cameraControls = cameraControls;

    this.loader = new THREE.FontLoader();

    // Setups
    this.totalMass = 3;
    this.cMaterial = new C.Material({});
    const contactMaterial = new C.ContactMaterial(
      this.cMaterial, // Material #1
      this.cMaterial, // Material #2
      {
        friction: 0.99,
        frictionEquationRelaxation: 30000,
        restitution: 0.01,
      }
    );
    this.world.addMaterial(this.cMaterial);
    this.world.addContactMaterial(contactMaterial);

    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    // Loader
    //this.loader.load(fontURL, (f) => { this.setup(f) })
    this.setup();

    this.bindEvents();
  }

  bindEvents() {
    const bindToElem = document.getElementById("stage");
    bindToElem.addEventListener("mousedown", (e) => {
      this.onMouseDown(e);
    });
    bindToElem.addEventListener("pointerdown", (e) => {
      this.onMouseDown(e);
    });
    bindToElem.addEventListener("mouseup", (e) => {
      this.onMouseUp(e);
    });
    bindToElem.addEventListener("pointerup", (e) => {
      this.onMouseUp(e);
    });
    bindToElem.addEventListener("mousemove", (e) => {
      this.onMouseMove(e);
    });
    bindToElem.addEventListener("pointermove", (e) => {
      this.onMouseMove(e);
    });
  }

  setup() {
    this.planetBodies = [];
    this.ball = null;
    //const planetBodies = new THREE.Group()
    /*this.margin = 6
        this.offset = this.$navItems.length * this.margin * 0.5 - 1

        const options = {
            font,
            size: 3,
            height: 0.4,
            curveSegments: 24,
            bevelEnabled: true,
            bevelThickness: 0.9,
            bevelSize: 0.3,
            bevelOffset: 0,
            bevelSegments: 10,
        }*/

    this.ballMassCoefficient = 0.000001; // Very small, so that ball doesn't cause planets to move
    const planets = [
      {
        type: "ball",
        //position: new C.Vec3(17, 17, 17),
        position: new C.Vec3(2, 10.5, 0),
        radius: 0.3,
        mass: 0.1 * this.ballMassCoefficient,
        color: new THREE.Color("#FFFFFF"),
      },
      {
        type: "planet",
        position: new C.Vec3(2, 0, 5),
        radius: 2,
        mass: 400,
        color: new THREE.Color("#9367C4"),
      },
      {
        type: "planet",
        position: new C.Vec3(-4, -4, -4),
        radius: 0.5,
        mass: 200,
        color: new THREE.Color("#D8F285"),
      },
      {
        type: "planet",
        position: new C.Vec3(2, 7, 0),
        radius: 3,
        mass: 400,
        color: new THREE.Color("#67C473"),
      },
      {
        type: "planet",
        position: new C.Vec3(-8, 7, 4),
        radius: 1,
        mass: 400,
        color: new THREE.Color("#C46773"),
        hoop: {
          radius: 0.6,
          tube: 0.08,
          position: new C.Vec3(0, 1.1, 0),
          color: new THREE.Color("#FFFFFF"),
        }
      },
    ];

    planets.forEach((planet, i) => {
      console.log("Creating planet:", planet);

      // Three.js
      const material = new THREE.MeshPhongMaterial({
        color: planet.color,
        shininess: 0,
      });
      const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);

      //geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      const mesh = new THREE.Mesh(geometry, material);

      // Cannon.js
      mesh.initPosition = planet.position;

      //words.len += mesh.size.x

      const cannonShape = new C.Sphere(planet.radius);

      mesh.body = new C.Body({
        mass: planet.mass,
        position: mesh.initPosition,
        material: this.cMaterial,
        linearDamping: 0.4,
        angularDamping: 0.9,
      });

      mesh.body.addShape(cannonShape, new C.Vec3());

      // Hoop
      if(planet.hoop)
      {
        const hoop = planet.hoop;
        const hoopMaterial = new THREE.MeshPhongMaterial({
          color: hoop.color,
          shininess: 0,
        });
        const hoopGeometry = new THREE.TorusGeometry(hoop.radius, hoop.tube, 32, 32);
        const hoopMesh = new THREE.Mesh(hoopGeometry, hoopMaterial);

        const hoopBodyShape = new C.Trimesh.createTorus(hoop.radius, hoop.tube, 32, 32);
        /*hoopMesh.body = new C.Body({
          mass: hoop.mass,
          position: hoopMesh.initPosition,
          material: this.cMaterial,
          linearDamping: 0.4,
          angularDamping: 0.9,
        });*/ // For now maybe the hoop body can have the same properties as the planet it's on
  
        mesh.body.addShape(hoopBodyShape, hoop.position);
  
        //this.world.addBody(hoopMesh.body);
        mesh.add(hoopMesh);
        hoopMesh.position.set(hoop.position.x, hoop.position.y, hoop.position.z);

        this.hoop = hoopMesh;

        // Hoop plane for detecting win
        const vertices = [
          hoop.radius, 0, 0, // Centre of 'plane'
          0, hoop.radius, 0,
          -hoop.radius, 0, 0,
          0, -hoop.radius, 0
        ];
        const indices = [
          0, 1, 2,
          2, 3, 0
        ];
        const hoopPlane = new C.Trimesh(vertices, indices);
        //const hoopPlane = new C.Cylinder(100, 100, 0.0001, 32);

        const hoopPlaneBody = new C.Body({position: planet.position});
        hoopPlaneBody.addShape(hoopPlane, hoop.position);
        //const hoopPlaneBody = new C.Body({position: new C.Vec3()});
        //hoopPlaneBody.addShape(hoopPlane, new C.Vec3());
        hoopPlaneBody.collisionResponse = false;
        this.world.addBody(hoopPlaneBody);
        this.hoopPlaneBody = hoopPlaneBody;
      }

      this.world.addBody(mesh.body);
      this.planetBodies.push(mesh);
      this.scene.add(mesh);

    });

    // Golf ball forces
    this.logs = 0;
    this.world.addEventListener("postStep", () => {
      const doLogs = this.logs % 100 == 0;

      const ballBody = this.planetBodies[0].body;
      let totalForce = new C.Vec3(0, 0, 0);

      // Gravity
      const g = 1; // Gravitational constant

      this.planetBodies.forEach((planetMesh, i) => {
        if (i > 0) {
          const planetBody = planetMesh.body;
          /*if (doLogs) {
            console.log("ballBody:", ballBody);
            console.log(
              "planetBody.position:",
              planetBody.position,
              "ballBody.position:",
              JSON.stringify(ballBody.position)
            );
          }*/

          // Calculate difference vector
          //const difference = planetBody.position.clone();
          //difference.vsub(ballBody.position);
          const difference = planetBody.position.vsub(ballBody.position);
          /*if (doLogs)
            console.log(
              "Difference vec for planetBody ",
              JSON.stringify(planetBody.position),
              " is ",
              JSON.stringify(difference)
            );*/
          const distance = difference.length();
          difference.normalize();

          // Calculate force due to Newtonian gravity
          difference.scale(
            (g * planetBody.mass * ballBody.mass) / Math.pow(distance, 2),
            difference
          );
          planetBody.force = difference.negate(new C.Vec3());
          totalForce = totalForce.vadd(difference);
          /*if (doLogs)
            console.log(
              "Force vec for planetBody ",
              JSON.stringify(planetBody.position),
              " is ",
              JSON.stringify(difference)
            );*/
        }
      });

      // Surface friction/stickiness
      if(doLogs) console.log("this.world.contacts", this.world.contacts);
      const stickiness = 3;
      const ballContacts = this.world.contacts.filter( ({bi, bj}) => (bi === ballBody || bj === ballBody) );
      const touchingPlanet = (ballContacts.length > 0);
      ballBody.linearDamping = touchingPlanet ? 0.9 : 0.4;
      ballBody.force = totalForce;
      if(touchingPlanet) {
        if(ballBody.velocity.length() < stickiness) {
          ballBody.velocity = new C.Vec3();
          ballBody.force = new C.Vec3();
        }
      }
      //if (doLogs) console.log("Total force:", JSON.stringify(totalForce));

      this.logs++;
    });

    // Detect ball passing through hole
    //console.log("Got here");
    if(this.hoop && this.hoopPlaneBody)
    {
      console.log("Got here");
      this.world.addEventListener("preStep", () => {
        this.ballPrestepPosition = this.ball.body.position.clone();
      });

      this.world.addEventListener("postStep", () => {
        //const doLogs = this.logs % 100 == 0;
        //if(doLogs) console.log("pre:"+this.ballPrestepPosition.x+","+this.ballPrestepPosition.y+","+this.ballPrestepPosition.z);
        //if(doLogs) console.log("post:"+this.ball.body.position.x+","+this.ball.body.position.y+","+this.ball.body.position.z);
        //if(doLogs) console.log("body:", this.hoopPlaneBody);
        const ray = new C.Ray(this.ballPrestepPosition, this.ball.body.position);
        //const ray = new C.Ray(new C.Vec3(0, 0, -10), new C.Vec3(0, 0, 10));
        //if(doLogs) console.log("ray:", ray);
        ray.checkCollisionResponse = false;
        ray.intersectWorld(this.world, {}); // intersectBodies seems not to work properly
        if(ray.result.body && ray.result.body === this.hoopPlaneBody) {
          console.log("----------!!!!!!!!Has hit!!!!!!!----------");
          alert("Hole complete!");
        }
      });
    }
    this.ball = this.planetBodies[0];

    //this.setConstraints()
  }

  /* Handlers
    --------------------------------------------------------- */

  onMouseMove(event) {
    //console.log("onMouseMove()");
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (this.takingShot) {
      // Calculate point of intersection with shot sights circle
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(
        this.scene.children,
        true
      );
      //console.log("onMouseDown: this.scene.children", this.scene.children);
      //console.log("onMouseDown: intersects", intersects);

      intersects.forEach(({ object, point }) => {
        //const { object, point } = intersect;
        if (this.shotSights === object) {
          //console.log("onMouseMove() with takingShot");
          if (this.shotArrow) {
            this.scene.remove(this.shotArrow);
          }
          const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color("#22CC22"),
            transparent: true,
            opacity: 0.8,
            //side: THREE.DoubleSide
          });
          const arrowVector = point.sub(this.shotStart);
          const halfwayVector = this.shotStart.clone();
          halfwayVector.addScaledVector(arrowVector, 0.5);
          this.shotVector = new THREE.Vector3();
          this.shotVector.copy(arrowVector);
          const arrowGeometry = new THREE.CylinderGeometry(
            0.1,
            0.1,
            arrowVector.length()
          );
          const arrowMesh = new THREE.Mesh(arrowGeometry, material);
          this.shotArrow = arrowMesh;
          arrowMesh.position.set(
            halfwayVector.x,
            halfwayVector.y,
            halfwayVector.z
          );
          const rot1 = new THREE.Quaternion();
          rot1.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            arrowVector.normalize()
          );
          arrowMesh.setRotationFromQuaternion(rot1);
          this.scene.add(arrowMesh);
        }
      });
    } else {
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const intersects = this.raycaster.intersectObjects(
        this.scene.children,
        true
      );

      const hoveringOverBall =
        intersects.length > 0 && intersects[0].object === this.ball;
      document.body.style.cursor = hoveringOverBall ? "pointer" : "";
    }
  }

  onMouseDown(event) {
    //console.log("onMouseDown()");
    event.preventDefault();
    // update the picking ray with the camera and mouse position
    //console.log("onMouseDown: this.mouse", this.mouse);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );
    //console.log("onMouseDown: this.scene.children", this.scene.children);
    //console.log("onMouseDown: intersects", intersects);

    if (intersects.length > 0) {
      const obj = intersects[0];
      const { object } = obj;

      if (!object.isMesh) return;

      /*this.planetBodies.forEach((planet) => {
        const { body } = planet;

        if (planet !== object) return;

        body.applyLocalImpulse(impulse, new C.Vec3());
      });*/

      if (object !== this.ball) return;

      this.takingShot = true;
      if (this.cameraControls) this.cameraControls.enabled = false;

      this.shotStart = this.ball.position;
      //console.log("this.ball:", this.ball);
      //console.log("Shot start:", this.shotStart);
      //const impulse = new C.Vec3().copy(face.normal).scale(-force);
      //body.applyLocalImpulse(impulse, new C.Vec3());

      const material = new THREE.MeshLambertMaterial({
        color: new THREE.Color("#CCCC00"),
        transparent: true,
        opacity: 0.3,
        //        side: THREE.DoubleSide
      });
      const geometry = new THREE.CircleGeometry(6, 32, 0, 2 * Math.PI);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(this.shotStart.x, this.shotStart.y, this.shotStart.z);
      /*console.log(
        "this.camera.getWorldDirection(new Vector3()):",
        this.camera.getWorldDirection(new THREE.Vector3())
      );*/
      const rot1 = new THREE.Quaternion();
      rot1.setFromUnitVectors(
        new THREE.Vector3(0, 0, -1),
        this.camera.getWorldDirection(new THREE.Vector3()).normalize()
      );
      mesh.setRotationFromQuaternion(rot1.normalize());
      this.shotSights = mesh;
      this.scene.add(mesh);
    }
  }

  onMouseUp() {
    //console.log("onMouseUp()");
    if (this.takingShot) {
      this.takingShot = false;
      if (this.cameraControls) this.cameraControls.enabled = true;

      //console.log("this.shotVector:", this.shotVector);
      //console.log("this.shotVector.length():", this.shotVector.length());
      let impulse = new C.Vec3(
        this.shotVector.x,
        this.shotVector.y,
        this.shotVector.z
      );
      impulse = impulse.scale(0.5 * this.ballMassCoefficient);
      this.ball.body.applyLocalImpulse(impulse, new C.Vec3());

      this.scene.remove(this.shotSights);
      this.scene.remove(this.shotArrow);
    }
  }

  /* Actions
    --------------------------------------------------------- */

  update() {
    if (!this.planetBodies) return;

    this.planetBodies.forEach((planet) => {
      planet.position.copy(planet.body.position);
      planet.quaternion.copy(planet.body.quaternion);
    });
  }

  /* Values
    --------------------------------------------------------- */

  setConstraints() {
    this.words.forEach((word) => {
      for (let i = 0; i < word.children.length; i++) {
        const letter = word.children[i];
        const nextLetter =
          i + 1 === word.children.length ? null : word.children[i + 1];

        if (!nextLetter) continue;

        const dist = letter.body.position.distanceTo(nextLetter.body.position);

        const c = new C.DistanceConstraint(
          letter.body,
          nextLetter.body,
          dist,
          1e3
        );
        c.collideConnected = true;

        this.world.addConstraint(c);
      }
    });
  }
}

/* CONSTANTS & HELPERS
---------------------------------------------------------------------------------------------------- */

//const fontURL = './dist/fonts/helvetiker_bold.typeface.json'
const colors = [
  {
    from: new THREE.Color("#76B36F"),
    to: new THREE.Color("#D8F285"),
  },
  {
    from: new THREE.Color("#86DE93"),
    to: new THREE.Color("#4C7B69"),
  },
  {
    from: new THREE.Color("#67C473"),
    to: new THREE.Color("#3D7D36"),
  },
];
