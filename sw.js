/* [sw.js] 서비스 워커 전체 코드 */
const CACHE_NAME = 'synapse-spark-v1.2';
const ASSETS = [
    './',
    './index.html',
    './style.css?v=1.1',
    './script.js?v=1.1',
    './manifest.json',
    'https://cdn-icons-png.flaticon.com/512/1164/1164620.png'
];

// 설치 단계: 리소스를 브라우저에 저장
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// 활성화 단계: 옛날 버전 캐시 삭제
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
});

// 네트워크 가로채기: 저장된 내용 우선 사용
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
});
