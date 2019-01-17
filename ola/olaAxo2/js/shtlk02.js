/////////Global Variables///////////
var camera, scene, renderer, rectangle, div, controls, sliderNum;
var scene2, renderer2, manager;

window.addEventListener( 'resize', onWindowResize, false );
document.getElementById('container').addEventListener('dblclick', mixerPlay)

// console.log(isMobileDevice());


// document.getElementById('container').addEventListener('touchstart', function(e){
//   e.preventDefault();
// }, { passive: false });
var clock = new THREE.Clock();
var mixer;
var clips;
var composer;

////////////CSS3d////////////////
//NOTE CSS VARIABLES
var noteDivObjects = [];
var noteObjects = [];
var divPositions = [];
var annoFiles = ["img/bubble.png","img/tweet.png", "img/bubble.png"];


/////////INIT VAIRABLES////////
var screenWidth = window.innerWidth; 
var screenHeight = window.innerHeight;
var aspect = screenWidth / screenHeight;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

////CAMERA////////////
var frustumSize = 1000;
var slider = document.getElementById("myRange");
var camTarget = new THREE.Vector3(0, 0, 0);
var radius = 90;
var startAngle = 220;
var dirLight, helper;
var TOD = 15;

////////////////////////////////////////////////////////////////////////////


init();

function init(){
  //Scenes//////////////////////////////
  scene = new THREE.Scene();
  scene2 = new THREE.Scene();
  
  //CAMERA///////////////////////////////
  near = -100; 
  far = 10000;
  camera = new THREE.OrthographicCamera( frustumSize*aspect/-2, frustumSize*aspect/2, frustumSize/2, frustumSize/-2, near, far );
  camera.position.x = 20;
  camera.position.y = 30;
  camera.position.z = 20;
  camera.zoom = 8;
  camera.updateProjectionMatrix();
  var camTarget = new THREE.Vector3(0, 20, 0);


  var path = 'texture/';
  var format = '.jpg';
  var envMap = new THREE.CubeTextureLoader().load( [
    path + 'posx' + format, path + 'negx' + format,
    path + 'posy' + format, path + 'negy' + format,
    path + 'posz' + format, path + 'negz' + format
  ] );

  var geom = new THREE.PlaneGeometry(500, 500, 10);
  var planeMat = new THREE.MeshBasicMaterial(0xffffff);
  var plane = new THREE.Mesh(geom, planeMat);
  plane.rotation.x = -Math.PI/2;
  plane.position.y  = 8;
  scene.add(plane);

  //ANNOTATION PLANES
  annoPlanes = [];
  annoPlanePos = [[20.2,16.18,35.04], [13.5,26.6,-48.74], [19.5,14.48,-0.32]];
  annoPlaneRot = [Math.PI / 2, Math.PI / 2, Math.PI / 2];
  annoPlaneSize = [3 ,8, 3];

  for (var i =  annoFiles.length - 1; i >= 0; i--) {
    var geometry = new THREE.PlaneGeometry( annoPlaneSize[i], annoPlaneSize[i], 32 );
    var texture = new THREE.TextureLoader().load( annoFiles[i] );
    var planeMaterial = new THREE.MeshBasicMaterial({
      map: texture, 
      side: THREE.DoubleSide, 
      transparent: true,
      opacity: 1
    });
    var plane = new THREE.Mesh(geometry, planeMaterial);
    plane.name = "annoPlane" + i ;
    plane.position.x = annoPlanePos[i][0];
    plane.position.y = annoPlanePos[i][1];
    plane.position.z = annoPlanePos[i][2];
    plane.rotation.y = annoPlaneRot[i];
    plane.rotation.y = Math.PI / 4;
    // scene.add(plane); 
  };


  //////////LOADER////////////////////////

  manager = new THREE.LoadingManager();
  var loader = new THREE.GLTFLoader( manager );
  
  var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
      console.log( Math.round(percentComplete, 2) + '% downloaded' );
    };
  };
  var onError = function ( xhr ) {
  };
  manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
    // console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
  };
  manager.onProgress = function ( item, loaded, total ) {
    // console.log( loaded, total );
  };
  manager.onLoad = function ( ) {
    animate();

    if (isMobileDevice() == true){
      console.log("true!!!")
      mixerPlay();
    } else {
      clips.forEach((clip) => {
        mixer.clipAction(clip).timeScale = 0;
        console.log(mixer.clipAction(clip).getEffectiveTimeScale());
      });
    };
  };

  // Load a glTF resource
  loader.load(
    'models/OLA_Test1.glb',
    function ( gltf ) {
      model = gltf.scene;
      clips = gltf.animations;
      scene.add( model );
      gltf.animations; // Array<THREE.AnimationClip>
      gltf.scene; // THREE.Scene
      gltf.asset; // Object

      gltf.scene.traverse(function(object) {

        if (object instanceof THREE.Mesh){
          object.material.envMap = envMap;
          object.material.envMapIntensity = 0.3;
        };

        if (object instanceof THREE.Mesh && object.name !='OLD_TOPO_CLOUDS') {
          object.castShadow = "true";
          object.receiveShadow = "true"
        };

        if (object instanceof THREE.Mesh && object.material.name =='Facade') {
          object.castShadow = "false";
          object.receiveShadow = "false"
          object.material.transparent = "true";
        };

        if (object instanceof THREE.Mesh && object.material.name =='Transparent') {
          object.material.transparent = "true";
          object.material.opacity = 0.5;
        };
      });

      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).setLoop( THREE.LoopPingPong)
        mixer.clipAction(clip).play();
        clips.push(clip);
      });
    },

    function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    function ( error ) {
      console.log( 'An error happened' );
    }
  );



  //LIGHT//////////////////////////////////
  var ambientlight = new THREE.AmbientLight( 0x080808, 10 ); 
  dirLight = new THREE.DirectionalLight( 0xFCF8E4, 1.0 );
  dirLight.shadow.camera.right =  200;
  dirLight.shadow.camera.left = -200;
  dirLight.shadow.camera.top =  200;
  dirLight.shadow.camera.bottom = -200;
  dirLight.position.y = (sunData[TOD].sunPosition.Y);
  dirLight.position.x = (sunData[TOD].sunPosition.X);
  dirLight.position.z = -(sunData[TOD].sunPosition.Z);
  dirLight.rotation.y = Math.PI / 18;
  dirLight.shadow.mapSize.width = 2048 * 2;
  dirLight.shadow.mapSize.height = 2048 * 2;
  dirLight.shadow.camera.near = 0;
  dirLight.shadow.camera.far = 1500;
  dirLight.bias = 0.0001;
  dirLight.castShadow = true;
  scene.add( dirLight.target);
  scene.add( dirLight );
  scene.add( ambientlight );
  
  //RENDERERS////////////////////////////////
  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
  renderer.shadowMap.enabled = true;
  renderer.gammaOutput = true;
  renderer.gammaFactor = 2.2;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize( screenWidth, screenHeight);
  renderer.autoClear = false;
  renderer.setClearColor( 0xffffff, 0);
  renderer.domElement.style.zIndex = 0;
  setPixelRatio();
  document.getElementById('container').appendChild( renderer.domElement );



  // renderer2 = new THREE.CSS3DRenderer();
  // renderer2.setSize(window.innerWidth, window.innerHeight);
  // document.getElementById('css3dScene').appendChild(renderer2.domElement);

  //CONTROLS////////////////////////////////
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.enablePan = true;
  controls.enableRotate = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.1;
  controls.target = camTarget;
  controls.update();

  //COMPOSER///////////////////////////////
  composer = new THREE.EffectComposer(renderer);
  var renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);
  renderPass.renderToScreen = true;




//////FUNCTIONS////////////////////////////

function animate(){

  var time2 = Date.now() * 0.002;
  scene.getObjectByName( "OLD_TOPO_CLOUDS" ).position.y = (Math.sin(time2*2))/4;
  scene.getObjectByName( "OLD_TOPO_BIRDS" ).position.y = (Math.sin(time2*7))/4;

  // TOD = Math.round(Math.sin(time2 / 10) * 20) + 25;
  dirLight.position.y = (sunData[20].sunPosition.Y);
  dirLight.position.x = (sunData[20].sunPosition.X);
  dirLight.position.z = -(sunData[20].sunPosition.Z);

  camera.updateProjectionMatrix();
  controls.update();
  // renderer2.render( scene2, camera);

  var delta = 0.5 * clock.getDelta();
  mixer.update(delta);

  composer.render();
  window.requestAnimationFrame( animate );
}}; 


function mixerPlay(event){
  console.log("fired");
  clips.forEach((clip) => {
    mixer.clipAction(clip).timeScale = 1;
    console.log(mixer.clipAction(clip).isRunning());
  });
};


function onDocumentMouseMove(event) {
    mouseX = ( event.clientX - windowHalfX ) * 0.005;
    mouseY = ( event.clientY - windowHalfY ) * 0.005;
};

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
};

function setPixelRatio(){
  if (window.devicePixelRatio > 2){
    renderer.setPixelRatio( window.devicePixelRatio / 2 );
  } else {
    renderer.setPixelRatio( window.devicePixelRatio );
  }
};

function onWindowResize() {
  var aspect = window.innerWidth / window.innerHeight;
  camera.left   = - frustumSize * aspect / 2;
  camera.right  =   frustumSize * aspect / 2;
  camera.top    =   frustumSize / 2;
  camera.bottom = - frustumSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  // renderer2.setSize( window.innerWidth, window.innerHeight );
};

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
};