        AFRAME.registerComponent('custom-touch-controls', {
            dependencies: ['look-controls'],

            init: function() {
                this.cameraEl = this.el.sceneEl.querySelector('a-camera');
                this.cameraEl.setAttribute('look-controls', {
                    enabled: false
                });

                this.startX = 0;
                this.startY = 0;
                this.lastTouchEnd = 0;
                this.handlingTouch = false;

                this.onTouchStart = this.onTouchStart.bind(this);
                this.onTouchMove = this.onTouchMove.bind(this);
                this.onTouchEnd = this.onTouchEnd.bind(this);

                this.el.sceneEl.addEventListener('touchstart', this.onTouchStart);
                this.el.sceneEl.addEventListener('touchmove', this.onTouchMove);
                this.el.sceneEl.addEventListener('touchend', this.onTouchEnd);
            },

            onTouchStart: function(evt) {
                if (evt.target.classList.contains('ui-element')) {
                    this.handlingTouch = false;
                    return;
                }
                this.handlingTouch = true;
                const touches = evt.touches[0];
                this.startX = touches.clientX;
                this.startY = touches.clientY;

                const currentTime = (new Date()).getTime();
                if (currentTime - this.lastTouchEnd <= 300) {
                    this.handleDoubleTap();
                    evt.preventDefault();
                }
                this.lastTouchEnd = currentTime;
            },

            onTouchMove: function(evt) {
                if (!this.handlingTouch) return;

                const xDelta = evt.touches[0].clientX - this.startX;
                const yDelta = evt.touches[0].clientY - this.startY;

                const currentRotation = this.cameraEl.getAttribute('rotation');

                currentRotation.y += xDelta * 0.2;
                currentRotation.x += yDelta * 0.2;

                currentRotation.y = this.clamp(currentRotation.y, -39, 39);
                currentRotation.x = this.clamp(currentRotation.x, -39, 39);

                this.cameraEl.setAttribute('rotation', currentRotation);

                this.startX = evt.touches[0].clientX;
                this.startY = evt.touches[0].clientY;

                evt.preventDefault();
            },

            onTouchEnd: function(evt) {
                if (this.handlingTouch) {
                    this.handlingTouch = false;
                    evt.preventDefault();
                }
            },

            handleDoubleTap: function() {
                var video = document.querySelector('#vr-video');
                if (video) {
                    var newTime = video.currentTime + 10;
                    video.currentTime = newTime > video.duration ? video.duration : newTime;
                }
            },

            clamp: function(value, min, max) {
                return Math.max(min, Math.min(max, value));
            }
        });

        const videoEl = document.getElementById('vr-video');
        const progressBar = document.getElementById('progress-bar');
        const progressContainer = document.getElementById('progress-container');
        const videoTimer = document.getElementById('video-timer');
        const currentTimeDisplay = document.getElementById('current-time');
        const durationDisplay = document.getElementById('duration');
        const controls = document.getElementById('controls');
        const fullscreenBtn = document.getElementById('fullscreenBtn');

        let hideControlsTimeout;
        let seeking = false;

        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            seconds = Math.floor(seconds % 60);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        function updateProgressBar() {
            const percentage = (videoEl.currentTime / videoEl.duration) * 100;
            progressBar.style.width = `${percentage}%`;
            currentTimeDisplay.textContent = formatTime(videoEl.currentTime);
        }

        function updatePlayPauseButton() {
            const playButton = document.getElementById('playBtn');
            const pauseButton = document.getElementById('pauseBtn');
            if (videoEl.paused || videoEl.ended) {
                playButton.style.display = '';
                pauseButton.style.display = 'none';
            } else {
                playButton.style.display = 'none';
                pauseButton.style.display = '';
            }
        }

        function updateFullscreenButton() {
            if (document.fullscreenElement) {
                fullscreenBtn.innerHTML = '<i class="fa fa-compress"></i>';
            } else {
                fullscreenBtn.innerHTML = '<i class="fa fa-expand"></i>';
            }
        }

        function showHideControls(show) {
            if (show) {
                controls.classList.remove('controls-hidden');
                fullscreenBtn.classList.remove('controls-hidden');
                progressContainer.classList.remove('controls-hidden');
                videoTimer.classList.remove('controls-hidden');
                updatePlayPauseButton();
            } else {
                controls.classList.add('controls-hidden');
                fullscreenBtn.classList.add('controls-hidden');
                progressContainer.classList.add('controls-hidden');
                videoTimer.classList.add('controls-hidden');
            }
        }

        function resetHideControls() {
            clearTimeout(hideControlsTimeout);
            hideControlsTimeout = setTimeout(() => showHideControls(false), 2000);
            showHideControls(true);
        }

        function playVideo() {
            if (videoEl.paused || videoEl.ended) {
                videoEl.play().catch(errorHandler);
                updatePlayPauseButton();
            }
        }

        function pauseVideo() {
            if (!videoEl.paused) {
                videoEl.pause();
                updatePlayPauseButton();
            }
        }

        function seekVideo(event) {
            console.log('Seek event called');
            const rect = progressContainer.getBoundingClientRect();
            const percent = (event.clientX - rect.left) / rect.width;
            const newTime = percent * videoEl.duration;
            console.log('Seek to:', newTime);
            videoEl.currentTime = newTime;
            updateProgressBar();
            resetHideControls();
        }

        function errorHandler(e) {
            const errorMessageEl = document.getElementById('error-message');
            errorMessageEl.textContent = `Failed to load video: ${e.message}`;
            errorMessageEl.style.display = 'block';
        }

        function hideErrorMessage() {
            document.getElementById('error-message').style.display = 'none';
        }

        function toggleFullScreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
            updateFullscreenButton();
        }

        videoEl.addEventListener('loadedmetadata', () => {
            durationDisplay.textContent = formatTime(videoEl.duration);
            updateProgressBar();
            resetHideControls();
        });

        videoEl.addEventListener('timeupdate', updateProgressBar);
        videoEl.addEventListener('play', updatePlayPauseButton);
        videoEl.addEventListener('pause', updatePlayPauseButton);
        videoEl.addEventListener('ended', updatePlayPauseButton);

        videoEl.addEventListener('click', (event) => {
            event.stopPropagation();
            if (videoEl.paused) {
                playVideo();
            } else {
                pauseVideo();
            }
        });

        videoEl.addEventListener('canplay', hideErrorMessage);
        videoEl.addEventListener('canplaythrough', hideErrorMessage);
        videoEl.addEventListener('waiting', () => {
            document.getElementById('buffering-indicator').style.display = 'block';
            resetHideControls();
        });
        videoEl.addEventListener('playing', () => {
            document.getElementById('buffering-indicator').style.display = 'none';
        });
        videoEl.addEventListener('error', errorHandler);

        document.addEventListener('click', resetHideControls);
        document.addEventListener('touchstart', resetHideControls);
        document.addEventListener('fullscreenchange', () => {
            updateFullscreenButton();
            resetHideControls();
        });

        progressContainer.addEventListener('click', seekVideo);
        progressContainer.addEventListener('mousedown', (event) => {
            seeking = true;
            seekVideo(event);
        });
        document.addEventListener('mousemove', (event) => {
            if (seeking) {
                seekVideo(event);
            }
        });
        document.addEventListener('mouseup', () => {
            seeking = false;
        });

        progressContainer.addEventListener('touchend', (event) => {
            event.preventDefault();
            seekVideo(event.changedTouches[0]);
        });
        progressContainer.addEventListener('touchstart', (event) => {
            event.preventDefault();
            seeking = true;
            seekVideo(event.changedTouches[0]);
        });
        document.addEventListener('touchmove', (event) => {
            event.preventDefault();
            if (seeking) {
                seekVideo(event.changedTouches[0]);
            }
        });
        document.addEventListener('touchend', () => {
            seeking = false;
        });

        document.getElementById('playBtn').addEventListener('click', playVideo);
        fullscreenBtn.addEventListener('click', toggleFullScreen);

        document.getElementById('video-url').addEventListener('change', (event) => {
            const url = event.target.value;
            if (!url) return;
            videoEl.src = url;
            videoEl.load();
        });

        document.addEventListener('DOMContentLoaded', () => {
            updateFullscreenButton();
            showHideControls(false);
            resetHideControls();
        });

        function clearUrl() {
            document.getElementById('video-url').value = '';
        }

        async function pasteUrl() {
            try {
                const text = await navigator.clipboard.readText();
                document.getElementById('video-url').value = text;
                loadVideo(text);
            } catch (err) {
                console.error('Failed to read clipboard contents:', err);
            }
        }

        function loadVideo(url) {
            if (!url) return;
            videoEl.src = url;
            videoEl.load();
            updateProgressBar();
            updatePlayPauseButton();
        }       