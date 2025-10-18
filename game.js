// 游戏状态
let scene, camera, renderer;
let player, ground;
let obstacles = [];
let coins = [];
let score = 0;
let isGameRunning = false;
let isJumping = false;
let jumpVelocity = 0;
let gravity = -0.02;
let gameSpeed = 0.1;
let obstacleSpawnTimer = 0;
let coinSpawnTimer = 0;

// 初始化Three.js场景
function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 10, 50);

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 1, 0);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // 创建地面
    const groundGeometry = new THREE.PlaneGeometry(10, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3a9d23,
        roughness: 0.8
    });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // 创建玩家
    const playerGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const playerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4169e1,
        roughness: 0.5,
        metalness: 0.3
    });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 0.4, 0);
    player.castShadow = true;
    scene.add(player);

    // 添加装饰性云朵
    createClouds();

    // 事件监听
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyPress);
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('restart-button').addEventListener('click', restartGame);

    // 开始渲染循环
    animate();
}

// 创建装饰性云朵
function createClouds() {
    for (let i = 0; i < 10; i++) {
        const cloudGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const cloudMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud.position.set(
            Math.random() * 20 - 10,
            3 + Math.random() * 2,
            -Math.random() * 50
        );
        cloud.scale.set(
            1 + Math.random(),
            0.5 + Math.random() * 0.5,
            1 + Math.random()
        );
        scene.add(cloud);
    }
}

// 创建障碍物
function createObstacle() {
    const obstacleGeometry = new THREE.BoxGeometry(1, 1.5, 1);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff4444,
        roughness: 0.4
    });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(
        Math.random() * 4 - 2,
        0.75,
        -30
    );
    obstacle.castShadow = true;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// 创建金币
function createCoin() {
    const coinGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
    const coinMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.8
    });
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.position.set(
        Math.random() * 4 - 2,
        1 + Math.random() * 1.5,
        -30
    );
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    scene.add(coin);
    coins.push(coin);
}

// 开始游戏
function startGame() {
    document.getElementById('game-info').style.display = 'none';
    isGameRunning = true;
    score = 0;
    updateScore();
}

// 重新开始游戏
function restartGame() {
    document.getElementById('game-over').style.display = 'none';
    
    // 清除所有障碍物和金币
    obstacles.forEach(obstacle => scene.remove(obstacle));
    coins.forEach(coin => scene.remove(coin));
    obstacles = [];
    coins = [];
    
    // 重置玩家位置
    player.position.y = 0.4;
    isJumping = false;
    jumpVelocity = 0;
    
    // 重置游戏参数
    gameSpeed = 0.1;
    obstacleSpawnTimer = 0;
    coinSpawnTimer = 0;
    
    startGame();
}

// 按键处理
function onKeyPress(event) {
    if (event.code === 'Space' && isGameRunning && !isJumping) {
        jump();
    }
}

// 跳跃
function jump() {
    if (player.position.y <= 0.4) {
        isJumping = true;
        jumpVelocity = 0.35;
    }
}

// 更新分数
function updateScore() {
    document.getElementById('score').textContent = '得分: ' + score;
}

// 检测碰撞
function checkCollision(obj1, obj2) {
    const distance = obj1.position.distanceTo(obj2.position);
    return distance < 1;
}

// 游戏结束
function gameOver() {
    isGameRunning = false;
    document.getElementById('final-score').textContent = '你的得分: ' + score;
    document.getElementById('game-over').style.display = 'block';
}

// 更新游戏逻辑
function update() {
    if (!isGameRunning) return;

    // 玩家跳跃逻辑
    if (isJumping || player.position.y > 0.4) {
        jumpVelocity += gravity;
        player.position.y += jumpVelocity;
        
        if (player.position.y <= 0.4) {
            player.position.y = 0.4;
            isJumping = false;
            jumpVelocity = 0;
        }
    }

    // 玩家旋转动画
    player.rotation.y += 0.05;

    // 生成障碍物
    obstacleSpawnTimer++;
    if (obstacleSpawnTimer > 60 / gameSpeed) {
        createObstacle();
        obstacleSpawnTimer = 0;
    }

    // 生成金币
    coinSpawnTimer++;
    if (coinSpawnTimer > 100 / gameSpeed) {
        createCoin();
        coinSpawnTimer = 0;
    }

    // 更新障碍物位置
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].position.z += gameSpeed;
        obstacles[i].rotation.y += 0.05;

        // 检测碰撞
        if (checkCollision(player, obstacles[i])) {
            gameOver();
            return;
        }

        // 移除超出视野的障碍物
        if (obstacles[i].position.z > 10) {
            scene.remove(obstacles[i]);
            obstacles.splice(i, 1);
            score += 1;
            updateScore();
            
            // 随着分数增加，游戏速度变快
            if (score % 10 === 0) {
                gameSpeed += 0.01;
            }
        }
    }

    // 更新金币位置
    for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].position.z += gameSpeed;
        coins[i].rotation.z += 0.1;

        // 检测金币收集
        if (checkCollision(player, coins[i])) {
            scene.remove(coins[i]);
            coins.splice(i, 1);
            score += 5;
            updateScore();
        }

        // 移除超出视野的金币
        if (coins[i].position.z > 10) {
            scene.remove(coins[i]);
            coins.splice(i, 1);
        }
    }
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// 窗口大小调整
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 初始化游戏
init();
