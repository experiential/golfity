import * as THREE from "three";
import C from "cannon";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

//import MenuHinge from './MenuHinge'
import Planets from "./Planets";

//import CannonDebugRenderer from './utils/CannonDebugRenderer'

const distance = 15;

export default class Scene {
  constructor() {
    this.$stage = document.getElementById("stage");

    this.setup();
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener("resize", () => {
      this.onResize();
    });
  }

  setup() {
    // Init Physics world
    this.world = new C.World();
    this.world.gravity.set(0, 0, 0);

    // Init Three components
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x1a1e1c, -10, 100);

    this.setCamera();
    this.setLights();
    this.setRender();

    // this.setupDebug()
    // controls
    console.log("this.renderer.domElement:", this.renderer.domElement);
    this.cameraControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    /*controls.maxPolarAngle = Math.PI * 0.5;
        controls.minDistance = 1000;
        controls.maxDistance = 5000;*/

    this.addObjects();
  }

  /* Handlers
    --------------------------------------------------------- */

  onResize() {
    const { W, H } = APP.Layout;

    this.camera.aspect = W / H;

    /*this.camera.top    = distance
        this.camera.right  = distance * this.camera.aspect
        this.camera.bottom = -distance
        this.camera.left   = -distance * this.camera.aspect*/

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H);

    this.renderer.render();
  }

  /* Actions
    --------------------------------------------------------- */

  setCamera() {
    const { W, H } = APP.Layout;
    const aspect = W / H;

    this.camera = new THREE.PerspectiveCamera(
      45,
      aspect,
      0.25,
      100
    );

    this.camera.position.set(-30, 10, 10);
    this.camera.lookAt(new THREE.Vector3());
  }

  setLights() {
    const ambient = new THREE.AmbientLight(0xcccccc);
    this.scene.add(ambient);

    const foreLight = new THREE.DirectionalLight(0xffffff, 0.5);
    foreLight.position.set(5, 5, 20);
    this.scene.add(foreLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 1);
    backLight.position.set(-5, -5, -10);
    this.scene.add(backLight);
  }

  setRender() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.$stage,
    });

    this.renderer.setClearColor(0x1a1e1c);
    this.renderer.setSize(APP.Layout.W, APP.Layout.H);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.renderer.setAnimationLoop(() => {
      this.draw();
    });
  }

  addObjects() {
    this.planets = new Planets(
      this.scene,
      this.world,
      this.camera,
      this.cameraControls
    );
  }

  /*setupDebug() {
        this.dbr = new CannonDebugRenderer(this.scene, this.world)

        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.enableKeys = false
        this.controls.update()
    }*/

  /* Values
    --------------------------------------------------------- */

  draw() {
    //console.log("draw() called")
    this.updatePhysics();
    this.renderer.render(this.scene, this.camera);
  }

  updatePhysics() {
    //console.log("updatePhysics() called")

    // Pause if taking shot
    if (this.planets.takingShot) return;

    if (this.dbr) this.dbr.update();

    this.planets.update();

    this.world.step(1 / 60);
  }
}
