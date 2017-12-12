var scene    = new THREE.Scene();
var camera   = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer({alpha:true});
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var turretArray=[];
var missileCollisionMap = [];
var antiMissileCount=0;
var explosionCount=0;
var spaceship_destroyed = false;
var spaceship_timer = 0,spaceship_present = false;
var score = 0,level=1;


var listener = new THREE.AudioListener();
camera.add( listener );
// create a global audio source
var sound = new THREE.Audio( listener );
var audioLoader = new THREE.AudioLoader();
var sound2 = new THREE.Audio( listener );
var audioLoader2 = new THREE.AudioLoader();

function onMouseDown(event){
  var vector = new THREE.Vector3();
  vector.set((event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
  vector.unproject( camera );
  var dir = vector.sub( camera.position ).normalize();
  var distance = - camera.position.z / dir.z;
  var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
  var missile = createAntiMissile(pos);
  audioLoader.load( 'laser.ogg', function( buffer ) {
  	sound.setBuffer( buffer );
  	sound.setLoop( true );
  	sound.setVolume( 0.5 );
  	sound.play();
  });
}

function onMouseUp(event){
  sound.stop();
}

window.onload = function(){
  audioLoader2.load( 'intro.ogg', function( buffer ) {
  	sound2.setBuffer( buffer );
  	sound2.setLoop( true );
  	sound2.setVolume( 0.5 );
  	sound2.play();
  });
}

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener( 'mousedown', onMouseDown, false );
window.addEventListener( 'mouseup', onMouseUp, false );
// (color, intensity)
var light = new THREE.PointLight(0xffffff, 1);
// (x, y, z)
light.position.set(3, 6, 6);
scene.add(light);

// (width, height, depth)
//origin_cube
var origin_geometry = new THREE.BoxGeometry(1, 1, 1);
var origin_material = new THREE.MeshLambertMaterial({color: 0xf6546a});
var origin = new THREE.Mesh(origin_geometry, origin_material);
//ground.rotation.x += 0.5;
origin.position.x=0;
origin.position.y =0;
origin.position.z =0;
scene.add(origin);

//ground
var ground_geometry = new THREE.BoxGeometry(40, 1, 5);
var ground_material = new THREE.MeshLambertMaterial({color: 0xf6546a});
var ground = new THREE.Mesh(ground_geometry, ground_material);
//ground.rotation.x += 0.5;
ground.position.x=0;
ground.position.y = 0;
ground.position.z = 0;
scene.add(ground);

//turrets
var turret1_geometry = new THREE.BoxGeometry(1,2,0.5);
var turret1_material = new THREE.MeshLambertMaterial({color: 0x228b22});
var turret1 = new THREE.Mesh(turret1_geometry,turret1_material);
turret1.position.y =1.5;
turret1.position.x =-11;
turret1.position.z=0;
scene.add(turret1);
turretArray.push(turret1);

var turret2 = new THREE.Mesh(turret1_geometry,turret1_material);
turret2.position.y =1.5;
turret2.position.x =0;
turret2.position.z=0;
scene.add(turret2);
turretArray.push(turret2);

var turret3 = new THREE.Mesh(turret1_geometry,turret1_material);
turret3.position.y =1.5;
turret3.position.x =11;
turret3.position.z=0;
scene.add(turret3);
turretArray.push(turret3);
//cities
var city1_geometry = new THREE.BoxGeometry(2,2,1);
var city1_material = new THREE.MeshLambertMaterial({color: 0xffff00});
var city1 = new THREE.Mesh(city1_geometry,city1_material);
city1.position.y =0.5;
city1.position.x =-5.5;
city1.position.z=0;
scene.add(city1);

var city2 = new THREE.Mesh(city1_geometry,city1_material);
city2.position.y =0.5;
city2.position.x =5.5;
city1.position.z=0;
scene.add(city2);

//missile
var missile_geometry = new THREE.SphereGeometry( 0.2, 32, 32 );
var missile_material = new THREE.MeshLambertMaterial( {color: 0xff0000} );
var anti_missile_geometry = new THREE.SphereGeometry( 0.2, 32, 32 );
var anti_missile_material = new THREE.MeshLambertMaterial( {color: 0x00bfff} );
// move the camera back
camera.position.x =0 ;
camera.position.y = 6;
camera.position.z = 10;

var explosion_geometry = new THREE.SphereGeometry(0.2,32,32);
var explosion_material = new THREE.MeshLambertMaterial({color:0xffff00});

var spaceship_geometry = new THREE.BoxGeometry(2,1,0.5);
var spaceship_material = new THREE.MeshLambertMaterial({color: 0xff00ff});
spaceship = new THREE.Mesh(spaceship_geometry,spaceship_material);
spaceshipBB = new THREE.Box3().setFromObject(spaceship);
spaceship.position.y = 10;
spaceship.position.x = -15;

window.setTimeout(function(){
  if(!spaceship_present){
    scene.add(spaceship);
    spaceship_present = true;
  }
},5000);



var missileArray = [],anti_missileArray = [],anti_missileArrayRemove = [],missileArrayRemove =[],explosionArray = [],explosionArrayRemove = [];
var maxMissileNumber = 5;

for(var i=0;i< maxMissileNumber; i++){
  var missile = new THREE.Mesh(missile_geometry,missile_material);
  missile.position.y = 15+Math.random()*5;
  missile.position.x = -10+Math.random()*20;
  var velocity = {x:-0.01+Math.random()*(0.02),y:0.01};
  missileArray.push({missile:missile,velocity:velocity,index:i});
  scene.add(missile);
}

function render(){
  requestAnimationFrame(render);
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( scene.children );

  //draws the descending missiles
  if(missileArray.length<15){
    if(missileArray.length>0){
      var groundBB = new THREE.Box3().setFromObject(ground);
      var turret1BB = new THREE.Box3().setFromObject(turret1);
      var turret2BB = new THREE.Box3().setFromObject(turret2);
      var turret3BB = new THREE.Box3().setFromObject(turret3);
      var city1BB = new THREE.Box3().setFromObject(city1);
      var city2BB = new THREE.Box3().setFromObject(city2);

      if(spaceship_present){
        spaceship.position.x += 0.05;
        if(spaceship.position.x > 15){
          spaceship_destroyed=true;
          spaceship_present = false;
          scene.remove(spaceship);
          spaceship.position.x = -10;
          if(missileArray.length>0){
            window.setTimeout(function(){
              if(!spaceship_present){
                scene.add(spaceship);
                spaceship_present = true;
              }
            },10000);
          }
        }
      }



      for(var i=0;i<missileArray.length;i++){
        missileArray[i].missile.position.x += missileArray[i].velocity.x;
        missileArray[i].missile.position.y -= missileArray[i].velocity.y;
        var missileBB = new THREE.Box3().setFromObject(missileArray[i].missile);
        //Load a sound and set it as the Audio object's buffer

        if(missileBB.intersectsBox(groundBB) || missileArray[i].missile.position.y < 0){
          createCollisionExplosion(missileArray[i].missile.position);
          score-=1;
          missileArrayRemove.push(missileArray[i].index);
        }
        else if(missileBB.intersectsBox(city1BB)){
          createCollisionExplosion(city1.position);
          score-=2;
          city1.position.y = -10;
          scene.remove(city1);
        }
        else if(missileBB.intersectsBox(city2BB)){
          createCollisionExplosion(city2.position);
          score-=2;
          city2.position.y = -10;
          scene.remove(city2);
        }
        else if(missileBB.intersectsBox(turret1BB)){
          createCollisionExplosion(turret1.position);
          score-=2;
          turret1.position.y = -10;
          scene.remove(turret1);
          turretArray.splice(0,1);
        }
        else if(missileBB.intersectsBox(turret2BB)){
          createCollisionExplosion(turret2.position);
          score-=2;
          turret2.position.y = -10;
          scene.remove(turret2);
          turretArray.splice(1,1);
        }
        else if(missileBB.intersectsBox(turret3BB)){
          createCollisionExplosion(turret3.position);
          score-=2;
          turret3.position.y = -10;
          scene.remove(turret3);
          turretArray.splice(2,1);
        }
      }

      //draws the anti missiles
      for(var i=0;i<anti_missileArray.length;i++){
        anti_missileArray[i].missile.position.x += anti_missileArray[i].velocity.x;
        anti_missileArray[i].missile.position.y += anti_missileArray[i].velocity.y;
        //check if anti missile is out of bounds
        var xdiff = Math.abs(anti_missileArray[i].missile.position.x - anti_missileArray[i].blowAtX);
        var ydiff = Math.abs(anti_missileArray[i].missile.position.y - anti_missileArray[i].blowAtY);
        if(xdiff<0.1 && ydiff<0.1){
          anti_missileArrayRemove.push(anti_missileArray[i].index);
          createCollisionExplosion(anti_missileArray[i].missile.position);
        }
      }

      for(var i=0;i<anti_missileArray.length;i++){
        var firstBB = new THREE.Box3().setFromObject(anti_missileArray[i].missile);

        if(spaceship_present && firstBB.intersectsBox(new THREE.Box3().setFromObject(spaceship))){
          anti_missileArrayRemove.push(anti_missileArray[i].index);
          createCollisionExplosion(spaceship.position);
          score+=10;
          spaceship_destroyed=true;
          spaceship_present = false;
          scene.remove(spaceship);
          spaceship.position.x = -10;
          if(missileArray.length>0){
            window.setTimeout(function(){
              if(!spaceship_present){
                scene.add(spaceship);
                spaceship_present = true;
              }
            },10000);
          }

        }

        for(var j=0;j<missileArray.length;j++){
          var secondBB = new THREE.Box3().setFromObject(missileArray[j].missile);
          var collision = firstBB.intersectsBox(secondBB);
          if(collision){
            score+=1;
            missileCollisionMap.push({asc:anti_missileArray[i].index,desc:missileArray[j].index});
            createCollisionExplosion(anti_missileArray[i].missile.position);
            break;
          }
        }
      }

      for(var i=0;i<explosionArray.length;i++){
        explosionArray[i].obj.scale.add(new THREE.Vector3( 0.01, 0.01, 0.01 ));
        explosionArray[i].time += 0.01;
        if(explosionArray[i].time>2){
          explosionArrayRemove.push(explosionArray[i].index);
          sound.stop();
        }
      }

      //removes the collided missles from the scene
      for(var i=0;i<missileCollisionMap.length;i++){
        var asc  = getMissileWithIndex(missileCollisionMap[i].asc,anti_missileArray);
        var desc = getMissileWithIndex(missileCollisionMap[i].desc,missileArray);
        if(asc!=999){
          scene.remove(anti_missileArray.splice(asc,1)[0].missile);
        }
        if(desc!=999){
          scene.remove(missileArray.splice(desc,1)[0].missile);
        }
      }
      //remove anti ballistic missile
      for(var i=0;i<anti_missileArrayRemove.length;i++){
        var asc  = getMissileWithIndex(anti_missileArrayRemove[i],anti_missileArray);
        if(asc!=999){
          scene.remove(anti_missileArray.splice(asc,1)[0].missile);
        }
      }
      //remove ballistic missiles
      for(var i=0;i<missileArrayRemove.length;i++){
        var asc  = getMissileWithIndex(missileArrayRemove[i],missileArray);
        if(asc!=999){
          scene.remove(missileArray.splice(asc,1)[0].missile);
        }
      }

      //remove ballistic missiles
      for(var i=0;i<explosionArrayRemove.length;i++){
        var asc  = getMissileWithIndex(explosionArrayRemove[i],explosionArray);
        if(asc!=999){
          scene.remove(explosionArray.splice(asc,1)[0].obj);
        }
      }

      missileCollisionMap = [];
      anti_missileArrayRemove = [];
      missileArrayRemove = [];

    }
    else{

      while(scene.children.length > 0){
        scene.remove(scene.children[0]);
      }

      maxMissileNumber+=5;

      for(var i=0;i< maxMissileNumber; i++){
        var missile = new THREE.Mesh(missile_geometry,missile_material);
        missile.position.y = 15+Math.random()*5;
        missile.position.x = -10+Math.random()*20;
        var velocity = {x:-0.01+Math.random()*(0.02),y:0.01};
        missileArray.push({missile:missile,velocity:velocity,index:i});
        scene.add(missile);
      }

      light.position.set(3, 6, 6);
      scene.add(light);

      // (width, height, depth)
      //origin_cube
      //ground.rotation.x += 0.5;
      origin.position.x=0;
      origin.position.y =0;
      origin.position.z =0;
      scene.add(origin);

      //ground
      ground.position.x=0;
      ground.position.y = 0;
      ground.position.z = 0;
      scene.add(ground);

      //turrets
      turret1.position.y =1.5;
      turret1.position.x =-11;
      turret1.position.z=0;
      scene.add(turret1);
      turretArray.push(turret1);

      turret2.position.y =1.5;
      turret2.position.x =0;
      turret2.position.z=0;
      scene.add(turret2);
      turretArray.push(turret2);

      turret3.position.y =1.5;
      turret3.position.x =11;
      turret3.position.z=0;
      scene.add(turret3);
      turretArray.push(turret3);
      //cities
      city1.position.y =0.5;
      city1.position.x =-5.5;
      city1.position.z=0;
      scene.add(city1);

      city2.position.y =0.5;
      city2.position.x =5.5;
      city1.position.z=0;
      scene.add(city2);

      //missile
      // move the camera back
      camera.position.x =0 ;
      camera.position.y = 6;
      camera.position.z = 10;

      spaceship.position.y = 10;
      spaceship.position.x = -15;
      level+=1;
    }
    document.getElementById("score").innerHTML = score;
    document.getElementById("level").innerHTML = level;
    document.getElementById("missile").innerHTML = missileArray.length;
  }
  else{
    document.getElementById("score").innerHTML = 0;
    document.getElementById("level").innerHTML = level;
    document.getElementById("missile").innerHTML = missileArray.length;
    document.getElementById("info").innerHTML = "Game Over Score: "+score;
    sound2.stop();
  }


  renderer.render(scene, camera);
}

render();

function createAntiMissile(pos){
  var missile = new THREE.Mesh(anti_missile_geometry,anti_missile_material);
  var min=999;
  var Turret;
  turretArray.forEach(function(turret){
    var distance = calculateDistance(pos,turret);
    if(min>distance){
      Turret = turret;
      min = distance;
    }
  });
  missile.position.y = Turret.position.y;
  missile.position.x = Turret.position.x;
  var x =pos.x;
  var y =pos.y;
  var v = pos.sub(Turret.position);
  v = v.normalize();
  var velocity = {x:0.1*v.x,y:0.1*v.y};
  anti_missileArray.push({missile:missile,velocity:velocity,index:antiMissileCount,blowAtX:x,blowAtY:y});
  scene.add(missile);
  antiMissileCount++;
}

function calculateDistance(pos,turret){
  return Math.pow((Math.pow(pos.x-turret.position.x,2)+Math.pow(pos.y-turret.position.y,2)),0.5);
}

function getMissileWithIndex(index,arr){
  var val = 999;
  for(var i=0;i<arr.length;i++){
    if(index==arr[i].index){
      val=i;
      break;
    }
  }
  return val;
}

function createCollisionExplosion(position){

  var explosion = new THREE.Mesh(explosion_geometry,explosion_material);
  explosion.position.x = position.x;
  explosion.position.y = position.y;
  scene.add(explosion);
  explosionArray.push({obj:explosion,time:0,index:explosionCount})

  explosionCount++;
}
