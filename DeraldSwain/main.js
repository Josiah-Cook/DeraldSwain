/*
  http://rodolphe-vaillant.fr
  
  Interactive Three JS code for the jiggle physic tutorial:
  http://rodolphe-vaillant.fr/entry/138/introduction-jiggle-physics-mesh-deformer 
  

*/

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.114/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.114/examples/jsm/controls/OrbitControls.js";
import { DragControls } from "https://cdn.jsdelivr.net/npm/three@0.114/examples/jsm/controls/DragControls.js";

import Stats from 'https://cdn.jsdelivr.net/npm/three@0.114/examples/jsm/libs/stats.module.js';

//import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.min.js';



 
/*
    Up vector: 'y' axis
    grid's square len: 100units

*/


let g_camera, g_scene, g_renderer;
let g_canvaContainer, g_controls;




// The mesh representing our "center of gravity"
// (i.e. barycenter, circumcenter or incenter according to the selected option)
let g_goalMesh;

// The transparent sphere 
let g_jiggleVertMesh;
let g_jiggleVertPrevious = new THREE.Vector3(0,0,0);


/*
Alternative to datGUI?
https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_additive_blending.html

*/
  
let DatGuiContext = function () {
    
    this.damping = 0.01;
    this.stifness = 0.05;    
    this.jiggleButton = jiggleButtonCallback;
    
};


let g_datGuiContext = new DatGuiContext();

// callback when the html page finish loading:
window.addEventListener("load", jigglePointV1InitUI);

function jigglePointV1InitUI() 
{  
    setValue();  

    if(true)
    {
        
           //datGUI summary:
           //https://www.nowherenearithaca.com/2015/07/datgui-easy-way-to-allow-users-to.html

           //dat.gui assumes the GUI type based on the target's initial value type.

            // - boolean => checkbox
            // - int/float => slider
            // - string => text input
            // - function => button        
        
        let gui = new dat.GUI();                  
      
        gui.add(g_datGuiContext, 'jiggleButton').name("Jiggle!");        
        gui.add(g_datGuiContext , 'damping' , 0 ,  1).name("Damping");
        gui.add(g_datGuiContext , 'stifness' , 0,  1).name("Stifness");
    }

};

//設定更新処理
function setValue() 
{
    g_goalMesh.position.set(0,0,0);
    g_jiggleVertMesh.position.set(0,0,0);
    g_jiggleVertPrevious = new THREE.Vector3(0,0,0);
}

function jiggleButtonCallback(){
    g_goalMesh.position.set(0,50,0);
    g_jiggleVertMesh.position.set(0,0,0);
    g_jiggleVertPrevious = new THREE.Vector3(0,0,0);
}


function init_scene() 
{
    let container = document.createElement('div');
    document.body.appendChild(container);
    
    g_camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    g_camera.position.set(50, 100, 150);    
    
    
    g_scene = new THREE.Scene();
    g_scene.background = new THREE.Color(0xffffff);//0xa0a0a0
    g_scene.fog = new THREE.Fog(0xffffff, 200, 800);//0xa0a0a0
    
    let light1 = new THREE.HemisphereLight(0xffffff, 0x444444);
    light1.position.set(0, 200, 0);
    g_scene.add(light1);
    
    let light2 = new THREE.DirectionalLight(0xbbbbbb);
    light2.position.set(0, 200, 100);
    light2.castShadow = true;
    light2.shadow.camera.top = 180;
    light2.shadow.camera.bottom = - 100;
    light2.shadow.camera.left = - 120;
    light2.shadow.camera.right = 120;
    g_scene.add(light2);
    //scene.add(new THREE.CameraHelper(light.shadow.camera));
    
    // ground
    let mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    g_scene.add(mesh);
    
    let grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;    
    g_scene.add(grid);
    
    g_renderer = new THREE.WebGLRenderer({ antialias: true });
    g_renderer.setPixelRatio(window.devicePixelRatio);
    g_renderer.setSize(window.innerWidth, window.innerHeight);
    g_renderer.shadowMap.enabled = true; 
    document.body.style.margin = 0;
    document.body.style.padding = 0;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    container.appendChild(g_renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);
    
    g_controls = new /*THREE.*/OrbitControls(g_camera, g_renderer.domElement);
    g_controls.target.set(0, 45, 0);
    g_controls.update();
}
  
  
function init() 
{   
 
    init_scene();  
    
    let draggableObjects = [];

    let sphereGeometry = new THREE.SphereBufferGeometry(1.0, 50, 50);    
    {
        let invertEllipsoid = false;
        let material = new THREE.MeshLambertMaterial({ 
            color: 0x777777, 
            transparent: true, 
            opacity: 0.45, 
            side: invertEllipsoid ? THREE.BackSide : THREE.FrontSide, 
            depthWrite: false });

        // Set up transparent sphere
        g_jiggleVertMesh = new THREE.Mesh(sphereGeometry, material);
        g_jiggleVertMesh.scale.set(50, 50, 50);
        g_jiggleVertMesh.castShadow = false;
        g_jiggleVertMesh.renderOrder = 0;
        
        g_scene.add(g_jiggleVertMesh);

        g_jiggleVertPrevious.copy( g_jiggleVertMesh.position );
    }

    let blue = new THREE.MeshPhongMaterial({ color: 0x3399dd });
    g_goalMesh = new THREE.Mesh(sphereGeometry, blue);   
    g_goalMesh.scale.set(10, 10, 10);
    g_goalMesh.position.set(0, 0, 0);
    g_goalMesh.castShadow = true;
    g_scene.add(g_goalMesh);
    draggableObjects.push( g_goalMesh );

    let dragControls = new DragControls(draggableObjects, g_camera, g_renderer.domElement);
    dragControls.addEventListener('dragstart', function () {
        g_controls.enabled = false;
    });
    dragControls.addEventListener('dragend', function () {
        g_controls.enabled = true;
    });
}

function onWindowResize() {
    g_camera.aspect = window.innerWidth / window.innerHeight;
    g_camera.updateProjectionMatrix();
    g_renderer.setSize(window.innerWidth, window.innerHeight);
}

function getPosition( pos ) {
    return new THREE.Vector3(pos.x, pos.y, pos.z);
}

function animate() 
{    
    let damping = 0.01;
    let stifness = 0.05;        
    damping = g_datGuiContext.damping;
    stifness = g_datGuiContext.stifness;
      
    { 
        // Not handling time:
        let currentPosition = getPosition( g_jiggleVertMesh.position );       
        let V = getPosition( g_jiggleVertMesh.position );    

        V.sub( g_jiggleVertPrevious );        

        V.multiplyScalar(1.0 - damping); 

        g_jiggleVertMesh.position.add( V );   
        
        let goal = getPosition( g_goalMesh.position );    
        goal.sub( g_jiggleVertMesh.position );        

        goal.multiplyScalar( stifness );    
        
        g_jiggleVertMesh.position.add( goal );      

        g_jiggleVertPrevious.copy( currentPosition );
    }

    requestAnimationFrame(animate);
    g_renderer.render(g_scene, g_camera);    
}

init();
animate();