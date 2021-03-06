//Standard Variables  
var camera, scene, renderer, controls, element;
var scene2, renderer2;
var clock = new THREE.Clock();
var clips = [];
var meshKnot, div, line;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var globalMatrixState = [];
var container = document.getElementById( 'ThreeJS' );

//Event Listeners
window.addEventListener( 'resize', onWindowResize, false );

init();
animate();

//THREE JS initiation function
function init(){
  //camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 250;
  camera.position.y = 250;
  camera.position.x = 250;
  controls = new THREE.OrbitControls(camera, container);
  controls.enablePan = false;
  
  //Primary Geometry
  htmlStateSelectors(); 
  boxAdder();


  //Extra Geometry
  var geometryPlane = new THREE.PlaneGeometry(3000,3000);
  var groundMaterial = new THREE.ShadowMaterial();
  groundMaterial.opacity = 0.2;
  var groundMirror = new THREE.Mesh(geometryPlane, groundMaterial);
  groundMirror.rotateX( - Math.PI / 2 );
  groundMirror.position.y = -100;
  groundMirror.receiveShadow = true;
  scene.add( groundMirror );
  var ambientlight = new THREE.AmbientLight( 0x080808, 15);  
  var spotlight = new THREE.SpotLight( 0xffffff );
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
  directionalLight.position.z = 200;
  directionalLight.position.y = 200;
  spotlight.position.y = 200;
  spotlight.castShadow = true;
  spotlight.shadow.mapSize.width = 1024;  // default
  spotlight.shadow.mapSize.height = 1024; // default
  
  // scene.add( spotlight );
  // scene.add( directionalLight );
  scene.add( ambientlight );
  
  //renderer
  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
  // renderer.setPixelRatio( window.devicePixelRatio );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0xffffff, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.zIndex = 5;
	container.appendChild( renderer.domElement );
};

//Animation Loop
function animate(){
  window.requestAnimationFrame( animate );
  // renderer2.render( scene2, camera );
  controls.update();  
  camera.updateProjectionMatrix();
  renderer.render( scene, camera);
};

//creates a div for each possible state with event listener
function htmlStateSelectors(){
  for (i = 0; i < Object.keys(mats[0].matrixStates).length; i++) {
    var stateDiv = document.createElement("h1");
    stateDiv.name = "state"+(i);
    stateDiv.id = i;
    var stateDivText = document.createTextNode("STATE " + (i));
    stateDiv.appendChild(stateDivText);
    var element = document.getElementById("title");
    element.appendChild(stateDiv);
    $('#'+(i)).click( objectAnimator );    
  }
};

//Adds a box for each JSON object
function boxAdder(){
  for (var i = 0; i < mats.length; i++){
    var box = new THREE.BoxGeometry( 10,10,10 );
    var material =  new THREE.MeshPhongMaterial({color: '#6b7784'});
    var cube = new THREE.Mesh(box, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.name = mats[i].name;
    cube.matrixAutoUpdate = false;
    var matArray = arrayToMatrix(mats[i].matrixStates.state0);
    var mat = translateRotateToMatrix(matArray);
    cube.matrix = mat;
    scene.add(cube);
  }
};

//creates tween functions for each state, for each cube.
function objectAnimator(){
  var tweens = [];
  var self = this.id;
  
  for (var i = 0; i < mats.length; i++) {
    
    var priorMatrixState = [];
    
    scene.traverse( function(child) {
      
      if (child.name == mats[i].name){
        //Local variables for each JSON object variables
        var ax, bx, mat1, mat2;
        //Retrieves the select state matrix from the JSON.
        var matrixArrayKey = Object.keys(mats[i].matrixStates)[self];
        var matrixArray = mats[i].matrixStates[matrixArrayKey];
        bx = arrayToMatrix(matrixArray);
        //Sets the initial tween state to the first state in the JSON
        if (globalMatrixState.length == 0){
          ax = arrayToMatrix(mats[i].matrixStates.state0);  
        } else {
          ax = globalMatrixState[i];
        };        
        bx.onStart = function(){
          console.log("tweenStarted")
        };
        bx.onComplete = function(){
          priorMatrixState.push(arrayToMatrix(matrixArray));  
          globalMatrixState = priorMatrixState;
          console.log("tweenComplete");
        };
        bx.onUpdate = function() {
          mat1 = new THREE.Matrix4();
          mat2 = new THREE.Matrix4();
          mat1.makeTranslation(ax[0], ax[1], ax[2]);
          mat2.makeRotationY(ax[3]);
          mat1.multiply(mat2);
          child.matrix = mat1;
          child.matrixAutoUpdate = false;
        };
        bx.ease = Power3.easeInOut;
        bx.paused = "true";
        tweens.push(TweenMax.to(ax, 1, bx))
      }
    })
  };
  for (var i = 0; i < tweens.length; i++){
    tweens[i].play();
  };
};

//takes a THREE.matrix4 and turn's it into a translation x,y,z and a z angle 
function arrayToMatrix(array){
  //empty variables to populate
  pos = new THREE.Vector3(0,0,0);
  quaternion = new THREE.Quaternion();
  scale = new THREE.Vector3(0,0,0);
  
  //empty matrix
  emptyMatrix = new THREE.Matrix4();
  emptyMatrix.set(array[0], array[1], array[2], array[3], array[4], array[5], array[6], array[7], array[8], array[9], array[10], array[11], array[12], array[13], array[14], array[15]);
  emptyMatrix.decompose(pos, quaternion, scale);
  
  return [pos.x, pos.z, pos.y, quaternion.x, quaternion.y, quaternion.z];
};

//Inverse of arrayToMatrix
function translateRotateToMatrix(array){
  mat1 = new THREE.Matrix4();
  mat2 = new THREE.Matrix4();
  mat1.makeTranslation(array[0], array[1], array[2]);
  // mat2.makeRotationY(array[4]);
  // mat1.multiply(mat2);
  return (mat1);
};

// on resizing of the window, resizes the scene/renderer
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  // renderer2.setSize(window.innerWidth, window.innerHeight);
};

document.addEventListener("keypress", function(e) {
  if (e.keyCode === 13) {
    toggleFullScreen();
    console.log("triggered");
  }
}, false);

function toggleFullScreen() {
  if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen(); 
    }
  }
}