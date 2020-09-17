import * as THREE from 'three'
import C from 'cannon'

// Options
const force = 50


export default class Planets {

    constructor(scene, world, camera) {
        this.$navItems = document.querySelectorAll('.mainNav a')

        this.scene = scene
        this.world = world
        this.camera = camera

        this.loader = new THREE.FontLoader()

        // Setups
        this.totalMass = 3
        this.cMaterial = new C.Material({ friction: 0.9, restitution: 0.5 })

        this.mouse = new THREE.Vector2()
        this.raycaster = new THREE.Raycaster()

        // Loader
        //this.loader.load(fontURL, (f) => { this.setup(f) })
        this.setup();

        //this.bindEvents()
    }

    bindEvents() {
        document.addEventListener('click', () => { this.onClick() })
        window.addEventListener('mousemove', (e) => { this.onMouseMove(e) })
    }


    setup() {
        this.planetBodies = []
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



        const planets = [
            { position: new C.Vec3(17, 17, 17), radius: 0.5, mass: 0.0001, color: new THREE.Color('#FFFFFF') },
            { position: new C.Vec3(2, 0, 5), radius: 2, mass: 400, color: new THREE.Color('#D8F285') },
            { position: new C.Vec3(-4, -4, -4), radius: 0.5, mass: 200, color: new THREE.Color('#76B36F') },
            { position: new C.Vec3(2, 7, 0), radius: 3, mass: 400, color: new THREE.Color('#67C473') },
        ];

        planets.forEach((planet, i) => {
            console.log("Creating planet:", planet)

            // Three.js
            const material = new THREE.MeshPhongMaterial({
                color: planet.color,
                shininess: 0,
            })
            const geometry = new THREE.SphereGeometry( planet.radius, 32, 32 );

            geometry.computeBoundingBox()
            geometry.computeBoundingSphere()

            const mesh = new THREE.Mesh(geometry, material)
            //mesh.position.set(planet.position.x, planet.position.y, planet.position.z);

            // Get size
            mesh.size = mesh.geometry.boundingBox.getSize(new THREE.Vector3())
            mesh.size.multiply(new THREE.Vector3(0.5, 0.5, 0.5))

            // Cannon.js
            mesh.initPosition = planet.position;

            //words.len += mesh.size.x

            const cannonShape = new C.Sphere(planet.radius);

            mesh.body = new C.Body({
                mass: planet.mass,
                position: mesh.initPosition,
                material: this.cMaterial,
                linearDamping: 0.05,
            })

            mesh.body.addShape(cannonShape, new C.Vec3(mesh.geometry.boundingSphere.center.x, mesh.geometry.boundingSphere.center.y, mesh.geometry.boundingSphere.center.z))

            this.world.addBody(mesh.body)
            this.planetBodies.push(mesh)
            /*if(i === 0)
                this.ball = mesh;*/

            /*    const pivotPos = mesh.initPosition.clone()

                pivotPos.y += 4

                // Pivot
                mesh.pivot = new C.Body({
                    mass: 0,
                    position: pivotPos,
                    shape: new C.Sphere(0.1),
                })

                const hingePivot = new C.HingeConstraint(mesh.body, mesh.pivot, {
                    pivotA: new C.Vec3(0, 4, 0),
                    pivotB: new C.Vec3(0, 0, 0),
                    axisA: C.Vec3.UNIT_X,
                    axisB: C.Vec3.UNIT_X,
                    maxForce: 1e3,
                })

                this.world.addConstraint(hingePivot)

                this.world.addBody(mesh.pivot)*/

            /*words.children.forEach((letter) => {
                letter.body.position.x -= words.len
                letter.pivot.position.x = letter.body.position.x
            })

            this.words.push(words)*/
            this.scene.add(mesh)
        })

        // Golf ball gravity
        this.logs = 0;
        this.world.addEventListener('postStep', () => {

            const doLogs = this.logs % 100 == 0;

            const ballBody = this.planetBodies[0].body;
            let totalForce = new C.Vec3(0, 0, 0);
            const g = 1;

            this.planetBodies.forEach((planetMesh, i) => {
                if(i > 0) {
                    const planetBody = planetMesh.body;
                    if(doLogs) {
                        console.log("ballBody:",ballBody)
                        console.log("planetBody.position:", planetBody.position, "ballBody.position:", JSON.stringify(ballBody.position));
                    }
                    
                    // Calculate difference vector
                    //const difference = planetBody.position.clone();
                    //difference.vsub(ballBody.position);
                    const difference = planetBody.position.vsub(ballBody.position);
                    if(doLogs) 
                        console.log("Difference vec for planetBody ",JSON.stringify(planetBody.position)," is ",JSON.stringify(difference));
                    const distance = difference.length();
                    difference.normalize();

                    // Calculate force due to Newtonian gravity
                    difference.scale(g * planetBody.mass * ballBody.mass / Math.pow(distance, 2), difference);
                    totalForce = totalForce.vadd(difference);
                    if(doLogs) 
                        console.log("Force vec for planetBody ",JSON.stringify(planetBody.position)," is ",JSON.stringify(difference));
                }
            });

            ballBody.force = totalForce;
            if(doLogs)
                console.log("Total force:", JSON.stringify(totalForce));

            this.logs++;
        });

        //this.setConstraints()
    }


    /* Handlers
    --------------------------------------------------------- */


    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

        this.raycaster.setFromCamera(this.mouse, this.camera)

        const intersects = this.raycaster.intersectObjects(this.scene.children, true)

        document.body.style.cursor = intersects.length > 0 ? 'pointer' : ''
    }

    onClick() {
        // update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera)

        // calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children, true)

        if (intersects.length > 0) {
            const obj = intersects[0]
            const { object, face } = obj

            if (!object.isMesh) return

            const impulse = new C.Vec3().copy(face.normal).scale(-force);

            this.planetBodies.forEach((planet) => {

                const { body } = planet

                if (planet !== object) return

                body.applyLocalImpulse(impulse, new C.Vec3())
            })
        }
    }


    /* Actions
    --------------------------------------------------------- */

    update() {
        if (!this.planetBodies) return

        this.planetBodies.forEach((planet) => {
            planet.position.copy(planet.body.position)
            planet.quaternion.copy(planet.body.quaternion)
        })
    }



    /* Values
    --------------------------------------------------------- */

    setConstraints() {
        this.words.forEach((word) => {
            for (let i = 0; i < word.children.length; i++) {
                const letter = word.children[i]
                const nextLetter = i + 1 === word.children.length ? null : word.children[i + 1]

                if (!nextLetter) continue

                const dist = letter.body.position.distanceTo(nextLetter.body.position)

                const c = new C.DistanceConstraint(letter.body, nextLetter.body, dist, 1e3)
                c.collideConnected = true

                this.world.addConstraint(c)
            }
        })
    }

}




/* CONSTANTS & HELPERS
---------------------------------------------------------------------------------------------------- */

//const fontURL = './dist/fonts/helvetiker_bold.typeface.json'
const colors = [
    {
        from : new THREE.Color('#76B36F'),
        to   : new THREE.Color('#D8F285'),
    },
    {
        from : new THREE.Color('#86DE93'),
        to   : new THREE.Color('#4C7B69'),
    },
    {
        from : new THREE.Color('#67C473'),
        to   : new THREE.Color('#3D7D36'),
    },
]
