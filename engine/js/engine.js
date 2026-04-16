let scene;
let camera;
let renderer;
let controls;
let modelRoot;
let engineParts = [];
let pickableMeshes = [];
let modelReady = false;
let animationLocked = false;
let runningPreview = false;
let hoverPartIndex = null;
let toastTimer = null;

const rotationPartIndices = [29, 30, 31, 32, 33, 34, 35];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const sceneRoot = document.getElementById('scene-root');
const progressValue = document.getElementById('progress-value');
const accuracyValue = document.getElementById('accuracy-value');
const scoreValue = document.getElementById('score-value');
const modeValue = document.getElementById('mode-value');
const mistakeValue = document.getElementById('mistake-value');
const hintValue = document.getElementById('hint-value');
const stepTag = document.getElementById('step-tag');
const stepTitle = document.getElementById('step-title');
const stepSummary = document.getElementById('step-summary');
const stepObjective = document.getElementById('step-objective');
const stepObserve = document.getElementById('step-observe');
const stepAction = document.getElementById('step-action');
const stepChecklist = document.getElementById('step-checklist');
const stepCounter = document.getElementById('step-counter');
const stepList = document.getElementById('step-list');
const focusTitle = document.getElementById('focus-title');
const focusCopy = document.getElementById('focus-copy');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const loadingFill = document.getElementById('loading-fill');
const toast = document.getElementById('toast');
const hintButton = document.getElementById('hint-button');
const demoButton = document.getElementById('demo-button');
const runToggle = document.getElementById('run-toggle');
const autoDemoButton = document.getElementById('auto-demo');
const resetButton = document.getElementById('reset-button');

const trainingSteps = [
    {
        id: 'top-service',
        badge: '步骤 1 / 顶部服务层',
        title: '解除顶部服务层',
        summary: '先移开顶部管线与上部盖件，腾出核心结构的可视观察窗口。',
        objective: '识别顶部服务层与主机体的连接位置',
        observe: '注意上方高亮部件与前端联接点的相对位置',
        action: '点击当前高亮零件组，系统将沿训练路径整体抬离',
        checklist: ['只操作顶部高亮零件，不提前拆侧向总成', '确认零件组已被抬升并与主机体脱离', '完成后继续观察下层暴露出的连接区域'],
        partIndices: [16, 17, 18, 19, 20, 21, 22, 23, 28, 31],
        center: [-0.281, -0.151, 4.697],
        direction: [0.05, 1.0, 0.7],
        spread: 1.4,
        lift: 2.8,
        fanAxis: [1, 0, 0],
        fanSpread: 0.52,
        camera: [-0.4, 4.2, 12.2],
        lookAt: [-0.25, 0.1, 4.6]
    },
    {
        id: 'front-fasteners',
        badge: '步骤 2 / 前端解锁',
        title: '拆下前端联接组',
        summary: '解除前端联接件与锁紧件，为两侧总成拆分创造空间。',
        objective: '建立前端联接组与后续侧向拆卸的先后顺序',
        observe: '观察前端零件组与上下结构的包络关系',
        action: '点击前端高亮件，系统将向外抽离并展开排列',
        checklist: ['当前只允许拆卸前端高亮联接组', '确认抽离后不会与上一步零件发生重叠', '为左右两侧总成的拆分留出空间'],
        partIndices: [24, 25, 26, 27, 32, 33, 34],
        center: [0.710, -1.269, 4.040],
        direction: [0.8, -0.1, 1.0],
        spread: 1.2,
        lift: 2.5,
        fanAxis: [0, 1, 0],
        fanSpread: 0.48,
        camera: [4.6, 1.0, 11.3],
        lookAt: [0.7, -1.0, 4.1]
    },
    {
        id: 'left-bank',
        badge: '步骤 3 / 左侧总成',
        title: '拆离左侧缸体总成',
        summary: '左侧总成体量较大，训练重点是按方向整体退出，而不是逐件乱拆。',
        objective: '理解左侧总成的整体拆离方向与受力路径',
        observe: '观察左侧总成与中央机体的接缝与退让空间',
        action: '点击左侧高亮总成，系统会沿左外侧方向平稳拆离',
        checklist: ['确保前两步已完成，避免拆卸顺序错误', '保持总成整体退出，不打乱其内部相对位置', '拆下后检查中央机体左侧界面是否清晰暴露'],
        partIndices: [0, 1, 2, 3, 4, 29],
        center: [-2.104, 0.267, 0.679],
        direction: [-1.0, 0.15, 0.25],
        spread: 1.5,
        lift: 3.8,
        fanAxis: [0, 1, 0],
        fanSpread: 0.58,
        camera: [-9.0, 3.0, 10.4],
        lookAt: [-2.15, 0.35, 0.7]
    },
    {
        id: 'right-bank',
        badge: '步骤 4 / 右侧总成',
        title: '拆离右侧缸体总成',
        summary: '右侧总成与左侧拆装逻辑对称，可用于训练顺序记忆与动作对比。',
        objective: '在镜像结构中复用正确拆装顺序',
        observe: '比较右侧总成与左侧总成的方向差异',
        action: '点击右侧高亮总成，系统会沿右外侧方向退出',
        checklist: ['只操作右侧高亮总成，避免重复点击已拆部件', '观察拆离后的左右空间是否均衡', '为下部与核心结构拆解建立完整视野'],
        partIndices: [5, 6, 7, 8, 30],
        center: [1.445, 0.503, 0.129],
        direction: [1.0, 0.15, 0.25],
        spread: 1.5,
        lift: 3.8,
        fanAxis: [0, 1, 0],
        fanSpread: 0.58,
        camera: [9.0, 3.1, 10.4],
        lookAt: [1.4, 0.45, 0.15]
    },
    {
        id: 'lower-attachment',
        badge: '步骤 5 / 下部附件',
        title: '拆除下部附件组',
        summary: '移开下部附件和支撑件，训练对拆装路径和碰撞风险的判断。',
        objective: '理解下部附件与核心壳体之间的让位关系',
        observe: '留意下方高亮部件与前后方向的避让空间',
        action: '点击下部高亮零件组，系统会向下前方抽离',
        checklist: ['确保左右两侧总成已先行拆离', '观察下部附件沿指定方向脱离机体', '完成后为核心壳体拆分预留完整通道'],
        partIndices: [9, 10, 11, 12, 13, 14, 15],
        center: [-0.892, -2.145, 4.119],
        direction: [-0.2, -0.8, 0.9],
        spread: 1.3,
        lift: 2.7,
        fanAxis: [1, 0, 0],
        fanSpread: 0.54,
        camera: [-1.2, -6.4, 11.0],
        lookAt: [-0.9, -2.0, 4.2]
    },
    {
        id: 'core-housing',
        badge: '步骤 6 / 核心壳体',
        title: '分离核心壳体与主机体',
        summary: '最后拆核心壳体，完成整机拆装训练闭环。',
        objective: '建立“由外到内、由约束到核心”的完整拆解认知',
        observe: '观察核心壳体暴露后，整机结构是否已经层层展开',
        action: '点击最后一组高亮零件，完成整机教学拆装演示',
        checklist: ['确认前置步骤全部完成后再拆核心壳体', '观察核心壳体被平稳抽离并与主机体分层展示', '训练完成后可重新训练或自动示范完整流程'],
        partIndices: [35, 36, 37, 38, 39, 40, 41],
        center: [-0.244, -0.851, 4.732],
        direction: [0.0, 0.05, 1.0],
        spread: 1.0,
        lift: 2.7,
        fanAxis: [1, 0, 0],
        fanSpread: 0.62,
        camera: [0.4, 1.8, 10.8],
        lookAt: [-0.2, -0.8, 4.8]
    }
];

const partStepMap = {};

trainingSteps.forEach(function(step, stepIndex) {
    step.index = stepIndex;
    step.centerVector = new THREE.Vector3(step.center[0], step.center[1], step.center[2]);
    step.directionVector = new THREE.Vector3(step.direction[0], step.direction[1], step.direction[2]).normalize();
    step.fanAxisVector = new THREE.Vector3(step.fanAxis[0], step.fanAxis[1], step.fanAxis[2]).normalize();
    step.cameraVector = new THREE.Vector3(step.camera[0], step.camera[1], step.camera[2]);
    step.lookAtVector = new THREE.Vector3(step.lookAt[0], step.lookAt[1], step.lookAt[2]);
    step.partIndices.forEach(function(partIndex) {
        partStepMap[partIndex] = stepIndex;
    });
});

const trainingState = {
    currentStepIndex: 0,
    completedSteps: new Set(),
    wrongAttempts: 0,
    hintsUsed: 0,
    autoDemoRunning: false,
    complete: false
};

function init() {
    initScene();
    bindEvents();
    renderStepListMarkup();
    refreshUI();
    loadModel();
    render();
}

function initScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x08131b, 18, 34);

    const bounds = sceneRoot.getBoundingClientRect();
    camera = new THREE.PerspectiveCamera(50, bounds.width / bounds.height, 0.1, 1000);
    camera.position.set(0, 2.3, 12.5);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    renderer.setSize(bounds.width, bounds.height);
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    sceneRoot.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableKeys = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 7;
    controls.maxDistance = 22;
    controls.target.set(0, 0.4, 3.9);
    controls.update();

    addLights();
    addStageDecor();
}

function addLights() {
    const ambient = new THREE.HemisphereLight(0xcbeeff, 0x07131b, 0.92);
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    const fill = new THREE.PointLight(0x7adfff, 0.55, 36);
    const rim = new THREE.PointLight(0xffc377, 0.65, 42);
    const back = new THREE.PointLight(0xb6d5ff, 0.35, 34);

    key.position.set(6, 12, 10);
    fill.position.set(-8, 2, 10);
    rim.position.set(0, -7, 8);
    back.position.set(0, 4, -10);

    scene.add(ambient);
    scene.add(key);
    scene.add(fill);
    scene.add(rim);
    scene.add(back);
}

function addStageDecor() {
    const grid = new THREE.GridHelper(30, 24, 0x2f607d, 0x173244);
    grid.position.y = -4.8;
    if (Array.isArray(grid.material)) {
        grid.material.forEach(function(material) {
            material.transparent = true;
            material.opacity = 0.18;
        });
    } else {
        grid.material.transparent = true;
        grid.material.opacity = 0.18;
    }
    scene.add(grid);

    const platform = new THREE.Mesh(
        new THREE.CircleBufferGeometry(9.5, 48),
        new THREE.MeshBasicMaterial({ color: 0x0f2535, transparent: true, opacity: 0.28 })
    );
    platform.rotation.x = -Math.PI / 2;
    platform.position.set(0, -4.85, 0);
    scene.add(platform);
}
function bindEvents() {
    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('pointermove', onPointerMove, false);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave, false);
    renderer.domElement.addEventListener('click', onSceneClick, false);

    hintButton.onclick = function() {
        if (!canInteract()) {
            return;
        }
        trainingState.hintsUsed += 1;
        focusStep(trainingState.currentStepIndex, 0.8);
        showToast('镜头已对准当前步骤目标。', 'info');
        refreshUI();
    };

    demoButton.onclick = async function() {
        if (!canInteract()) {
            return;
        }
        trainingState.hintsUsed += 1;
        refreshUI();
        await executeCurrentStep(true);
    };

    runToggle.onclick = function() {
        if (!modelReady || animationLocked || trainingState.autoDemoRunning) {
            return;
        }
        if (trainingState.completedSteps.size > 0 || trainingState.complete) {
            showToast('运转观察仅在整机装配状态下开放。', 'info');
            return;
        }
        runningPreview = !runningPreview;
        if (!runningPreview) {
            resetMovingParts();
        }
        refreshUI();
    };

    autoDemoButton.onclick = async function() {
        if (!modelReady || animationLocked || trainingState.autoDemoRunning) {
            return;
        }
        if (trainingState.complete) {
            showToast('训练已完成，可先重新训练后再执行自动演示。', 'info');
            return;
        }
        await playAutoDemo();
    };

    resetButton.onclick = async function() {
        if (!modelReady || animationLocked) {
            return;
        }
        await resetTraining();
    };
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    loadingText.textContent = '准备载入发动机总成';

    loader.load(
        'models/engine.gltf',
        function(gltf) {
            modelRoot = new THREE.Group();
            scene.add(modelRoot);

            gltf.scene.children.slice().forEach(function(child, index) {
                preparePart(child, index);
                engineParts[index] = child;
                modelRoot.add(child);
            });

            computeExplodedTargets();
            modelReady = true;
            loadingFill.style.width = '100%';
            loadingOverlay.classList.add('is-hidden');
            focusStep(0, 0.9);
            showToast('模型已就绪，点击高亮零件开始训练。', 'success');
            refreshUI();
        },
        function(xhr) {
            if (xhr.total) {
                const percent = Math.min(100, Math.round((xhr.loaded / xhr.total) * 100));
                loadingFill.style.width = percent + '%';
                loadingText.textContent = '发动机模型载入 ' + percent + '%';
            } else {
                loadingText.textContent = '发动机模型正在载入';
            }
        },
        function(error) {
            console.error(error);
            loadingText.textContent = '模型载入失败，请检查资源路径';
            showToast('模型载入失败，请查看控制台日志。', 'danger');
        }
    );
}

function preparePart(part, index) {
    part.userData.partIndex = index;
    part.userData.stepIndex = partStepMap[index];
    part.userData.originalPosition = part.position.clone();
    part.userData.originalQuaternion = part.quaternion.clone();

    part.traverse(function(node) {
        if (!node.isMesh) {
            return;
        }

        node.material = cloneMaterial(node.material);
        node.userData.partIndex = index;
        node.userData.stepIndex = partStepMap[index];
        pickableMeshes.push(node);
    });
}

function cloneMaterial(material) {
    if (Array.isArray(material)) {
        return material.map(cloneMaterial);
    }

    const cloned = material.clone();
    cloned.transparent = true;
    cloned.userData = cloned.userData || {};
    cloned.userData.baseOpacity = cloned.opacity;

    if (cloned.color) {
        cloned.userData.baseColor = cloned.color.clone();
    }

    if (cloned.emissive) {
        cloned.userData.baseEmissive = cloned.emissive.clone();
    }

    return cloned;
}

function computeExplodedTargets() {
    trainingSteps.forEach(function(step) {
        const count = step.partIndices.length;

        step.partIndices.forEach(function(partIndex, localIndex) {
            const part = engineParts[partIndex];
            const basePosition = part.userData.originalPosition.clone();
            const radial = basePosition.clone().sub(step.centerVector);
            const lane = localIndex - (count - 1) / 2;

            if (radial.lengthSq() < 0.0001) {
                radial.copy(step.directionVector);
            } else {
                radial.normalize();
            }

            part.userData.explodedPosition = basePosition
                .clone()
                .add(step.directionVector.clone().multiplyScalar(step.lift))
                .add(radial.multiplyScalar(step.spread))
                .add(step.fanAxisVector.clone().multiplyScalar(lane * step.fanSpread));
        });
    });
}

function render() {
    requestAnimationFrame(render);

    if (controls) {
        controls.update();
    }

    if (modelReady) {
        updateRunningPreview();
        updatePartVisuals();
    }

    renderer.render(scene, camera);
}

function updateRunningPreview() {
    if (!runningPreview) {
        return;
    }

    rotationPartIndices.forEach(function(partIndex) {
        const part = engineParts[partIndex];
        if (!part) {
            return;
        }

        const direction = (partIndex === 29 || partIndex === 33) ? 1 : -1;
        part.rotation.y += 0.035 * direction;
    });
}

function updatePartVisuals() {
    const pulse = 0.5 + (Math.sin(Date.now() * 0.004) + 1) * 0.25;

    engineParts.forEach(function(part, partIndex) {
        if (!part) {
            return;
        }

        const stepIndex = part.userData.stepIndex;
        const isCurrent = !trainingState.complete && stepIndex === trainingState.currentStepIndex;
        const isComplete = trainingState.completedSteps.has(stepIndex);
        const isHovered = hoverPartIndex === partIndex;

        let visual = {
            color: new THREE.Color(0xffffff),
            mix: 0,
            emissive: new THREE.Color(0x000000),
            emissiveMix: 0,
            opacity: 0.64
        };

        if (isComplete) {
            visual = {
                color: new THREE.Color(0xffc174),
                mix: 0.16,
                emissive: new THREE.Color(0xffaa45),
                emissiveMix: 0.16,
                opacity: 0.92
            };
        } else if (isCurrent) {
            visual = {
                color: new THREE.Color(0x87ebff),
                mix: 0.18 + pulse * 0.14,
                emissive: new THREE.Color(0x58dfff),
                emissiveMix: 0.22 + pulse * 0.22,
                opacity: 1
            };
        }

        if (!isComplete && isHovered) {
            visual.mix = Math.min(0.42, visual.mix + 0.12);
            visual.emissiveMix = Math.min(0.6, visual.emissiveMix + 0.12);
            visual.opacity = 1;
        }

        applyVisualToPart(part, visual);
    });
}

function applyVisualToPart(part, visual) {
    part.traverse(function(node) {
        if (!node.isMesh) {
            return;
        }
        applyVisualToMaterial(node.material, visual);
    });
}

function applyVisualToMaterial(material, visual) {
    if (Array.isArray(material)) {
        material.forEach(function(entry) {
            applyVisualToMaterial(entry, visual);
        });
        return;
    }

    if (material.userData.baseColor && material.color) {
        material.color.copy(material.userData.baseColor);
        material.color.lerp(visual.color, visual.mix);
    }

    if (material.userData.baseEmissive && material.emissive) {
        material.emissive.copy(material.userData.baseEmissive);
        material.emissive.lerp(visual.emissive, visual.emissiveMix);
    }

    material.opacity = visual.opacity;
}
function renderStepListMarkup() {
    stepList.innerHTML = trainingSteps.map(function(step, index) {
        const complete = trainingState.completedSteps.has(index);
        const active = !trainingState.complete && index === trainingState.currentStepIndex;
        let stateText = '待执行';
        let stateClass = '';

        if (complete) {
            stateText = '已完成';
            stateClass = ' is-complete';
        } else if (active) {
            stateText = '当前步骤';
            stateClass = ' is-active';
        }

        return (
            '<article class="step-card' + stateClass + '" data-order="' + String(index + 1).padStart(2, '0') + '">' +
                '<span class="step-state">' + stateText + '</span>' +
                '<h3>' + step.title + '</h3>' +
                '<p>' + step.summary + '</p>' +
            '</article>'
        );
    }).join('');
}

function refreshUI() {
    const completedCount = trainingState.completedSteps.size;
    const accuracy = getAccuracy();
    const score = getScore();
    const step = trainingSteps[trainingState.currentStepIndex];

    progressValue.textContent = completedCount + ' / ' + trainingSteps.length;
    accuracyValue.textContent = accuracy + '%';
    scoreValue.textContent = String(score);
    modeValue.textContent = getModeLabel();
    mistakeValue.textContent = '误操作 ' + trainingState.wrongAttempts + ' 次';
    hintValue.textContent = '提示 ' + trainingState.hintsUsed + ' 次';
    stepCounter.textContent = completedCount + ' / ' + trainingSteps.length + ' 已完成';

    if (trainingState.complete) {
        stepTag.textContent = '训练完成';
        stepTitle.textContent = '发动机拆装训练已完成';
        stepSummary.textContent = '当前 Demo 已完成整机拆装序列。你可以重新训练，或者使用自动演示复盘完整教学流程。';
        stepObjective.textContent = '复盘完整的拆装顺序';
        stepObserve.textContent = '观察整机已被层层展开的结构关系';
        stepAction.textContent = '点击“重新训练”即可从整机状态重新开始考核';
        stepChecklist.innerHTML = '<li>核对拆装顺序是否始终由外到内</li><li>检查误操作次数、提示次数与训练得分</li><li>重新训练以重复验证操作记忆</li>';
        focusTitle.textContent = '整机拆装完成';
        focusCopy.textContent = '本轮训练已经完成，可重置模型重新考核，或使用自动演示进行教学复盘。';
    } else if (step) {
        stepTag.textContent = step.badge;
        stepTitle.textContent = step.title;
        stepSummary.textContent = step.summary;
        stepObjective.textContent = step.objective;
        stepObserve.textContent = step.observe;
        stepAction.textContent = step.action;
        stepChecklist.innerHTML = step.checklist.map(function(item) {
            return '<li>' + item + '</li>';
        }).join('');
        focusTitle.textContent = step.title;
        focusCopy.textContent = step.action;
    }

    runToggle.textContent = runningPreview ? '停止观察' : '运转观察';
    hintButton.disabled = !canInteract();
    demoButton.disabled = !canInteract();
    autoDemoButton.disabled = !modelReady || animationLocked || trainingState.autoDemoRunning || trainingState.complete;
    resetButton.disabled = !modelReady || animationLocked;
    runToggle.disabled = !modelReady || animationLocked || trainingState.autoDemoRunning || completedCount > 0 || trainingState.complete;

    renderStepListMarkup();
}

function getAccuracy() {
    const finished = trainingState.completedSteps.size;
    if (!finished && !trainingState.wrongAttempts && !trainingState.hintsUsed) {
        return 100;
    }
    const divisor = Math.max(1, finished + trainingState.wrongAttempts + trainingState.hintsUsed);
    return Math.round((finished / divisor) * 100);
}

function getScore() {
    const score = 100 - trainingState.wrongAttempts * 8 - trainingState.hintsUsed * 4;
    return Math.max(0, Math.min(100, score));
}

function getModeLabel() {
    if (!modelReady) {
        return '加载中';
    }
    if (trainingState.autoDemoRunning) {
        return '自动演示';
    }
    if (trainingState.complete) {
        return '训练完成';
    }
    if (runningPreview) {
        return '整机观察';
    }
    return '拆装训练';
}

function canInteract() {
    return modelReady && !animationLocked && !trainingState.autoDemoRunning && !trainingState.complete;
}

function onPointerMove(event) {
    if (!modelReady || animationLocked) {
        renderer.domElement.style.cursor = 'default';
        return;
    }

    const partIndex = pickPart(event.clientX, event.clientY);
    hoverPartIndex = partIndex;

    if (partIndex === null) {
        renderer.domElement.style.cursor = 'grab';
        return;
    }

    const stepIndex = engineParts[partIndex].userData.stepIndex;
    renderer.domElement.style.cursor = stepIndex === trainingState.currentStepIndex ? 'pointer' : 'not-allowed';
}

function onPointerLeave() {
    hoverPartIndex = null;
    renderer.domElement.style.cursor = 'grab';
}

async function onSceneClick(event) {
    if (!modelReady || animationLocked) {
        return;
    }

    const partIndex = pickPart(event.clientX, event.clientY);
    if (partIndex === null) {
        return;
    }

    if (trainingState.complete) {
        showToast('训练已完成，可点击“重新训练”再次考核。', 'info');
        return;
    }

    const stepIndex = engineParts[partIndex].userData.stepIndex;

    if (trainingState.completedSteps.has(stepIndex)) {
        showToast('该零件组已拆下，请继续当前步骤。', 'info');
        return;
    }

    if (stepIndex !== trainingState.currentStepIndex) {
        trainingState.wrongAttempts += 1;
        showToast('当前应优先执行：' + trainingSteps[trainingState.currentStepIndex].title, 'danger');
        refreshUI();
        return;
    }

    await executeCurrentStep(false);
}

function pickPart(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(pickableMeshes, true);
    if (!intersections.length) {
        return null;
    }

    return resolvePartIndex(intersections[0].object);
}

function resolvePartIndex(object) {
    let current = object;
    while (current) {
        if (current.userData && current.userData.partIndex !== undefined) {
            return current.userData.partIndex;
        }
        current = current.parent;
    }
    return null;
}
async function executeCurrentStep(fromDemoButton) {
    const automated = trainingState.autoDemoRunning;
    if (!modelReady || animationLocked || trainingState.complete) {
        return;
    }
    if (!automated && !canInteract()) {
        return;
    }

    const stepIndex = trainingState.currentStepIndex;
    const step = trainingSteps[stepIndex];

    animationLocked = true;
    runningPreview = false;
    resetMovingParts();
    refreshUI();

    await focusStep(stepIndex, 0.7);
    await animateStep(stepIndex, true);

    trainingState.completedSteps.add(stepIndex);
    trainingState.currentStepIndex = stepIndex + 1;

    if (trainingState.currentStepIndex >= trainingSteps.length) {
        trainingState.complete = true;
        showToast(fromDemoButton ? '最后一步示范完成，训练结束。' : '整机拆装训练完成。', 'success');
    } else {
        showToast((fromDemoButton ? '示范完成：' : '完成：') + step.title, 'success');
        await focusStep(trainingState.currentStepIndex, 0.75);
    }

    animationLocked = false;
    refreshUI();
}

function animateStep(stepIndex, explode) {
    return new Promise(function(resolve) {
        const step = trainingSteps[stepIndex];
        const timeline = new TimelineMax({ paused: true, onComplete: resolve });

        step.partIndices.forEach(function(partIndex, localIndex) {
            const part = engineParts[partIndex];
            const target = explode ? part.userData.explodedPosition : part.userData.originalPosition;
            const offset = localIndex === 0 ? 0 : '-=0.76';

            timeline.to(
                part.position,
                0.82,
                {
                    x: target.x,
                    y: target.y,
                    z: target.z,
                    ease: Power2.easeInOut
                },
                offset
            );
        });

        timeline.play();
    });
}

function focusStep(stepIndex, duration) {
    return new Promise(function(resolve) {
        const step = trainingSteps[stepIndex];
        const pending = { count: 2 };

        if (!step) {
            resolve();
            return;
        }

        function completeOne() {
            pending.count -= 1;
            if (pending.count === 0) {
                resolve();
            }
        }

        TweenMax.to(camera.position, duration, {
            x: step.cameraVector.x,
            y: step.cameraVector.y,
            z: step.cameraVector.z,
            ease: Power2.easeInOut,
            onComplete: completeOne
        });

        TweenMax.to(controls.target, duration, {
            x: step.lookAtVector.x,
            y: step.lookAtVector.y,
            z: step.lookAtVector.z,
            ease: Power2.easeInOut,
            onUpdate: function() {
                controls.update();
            },
            onComplete: completeOne
        });
    });
}

async function playAutoDemo() {
    trainingState.autoDemoRunning = true;
    runningPreview = false;
    resetMovingParts();
    refreshUI();
    showToast('自动演示已启动，将依次示范全部拆装步骤。', 'info');

    while (!trainingState.complete && trainingState.currentStepIndex < trainingSteps.length) {
        trainingState.hintsUsed += 1;
        refreshUI();
        await executeCurrentStep(true);
        if (!trainingState.complete) {
            await wait(300);
        }
    }

    trainingState.autoDemoRunning = false;
    refreshUI();
}

async function resetTraining() {
    animationLocked = true;
    runningPreview = false;
    hoverPartIndex = null;

    for (let stepIndex = trainingSteps.length - 1; stepIndex >= 0; stepIndex--) {
        if (trainingState.completedSteps.has(stepIndex)) {
            await animateStep(stepIndex, false);
        }
    }

    engineParts.forEach(function(part) {
        if (!part) {
            return;
        }
        part.position.copy(part.userData.originalPosition);
        part.quaternion.copy(part.userData.originalQuaternion);
    });

    trainingState.currentStepIndex = 0;
    trainingState.completedSteps.clear();
    trainingState.wrongAttempts = 0;
    trainingState.hintsUsed = 0;
    trainingState.autoDemoRunning = false;
    trainingState.complete = false;

    await focusStep(0, 0.85);

    animationLocked = false;
    refreshUI();
    showToast('训练已重置，可重新开始拆装考核。', 'info');
}

function resetMovingParts() {
    rotationPartIndices.forEach(function(partIndex) {
        const part = engineParts[partIndex];
        if (!part) {
            return;
        }
        part.quaternion.copy(part.userData.originalQuaternion);
    });
}

function wait(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

function showToast(message, tone) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = 'toast is-visible';

    if (tone === 'danger') {
        toast.classList.add('is-danger');
    } else if (tone === 'success') {
        toast.classList.add('is-success');
    }

    toastTimer = setTimeout(function() {
        toast.classList.remove('is-visible');
    }, 2400);
}

function onWindowResize() {
    const bounds = sceneRoot.getBoundingClientRect();
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    renderer.setSize(bounds.width, bounds.height);
}

init();
