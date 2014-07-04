var vkObserver = {
    clearStorage: function() {
        chrome.storage.sync.clear();
        chrome.storage.sync.set({
            'settings': {
                "bitrate": 'enabled',
                "cache": 'enabled'
            }
        });
    },

    syncStorage: function() {
        var storage = chrome.storage.sync;
        storage.get('settings', function(data) {
            var storVal = data.settings;
            if (storVal == undefined) {
                vkObserver.clearStorage();
                localStorage['VkObserver_cache'] = 'enabled';
                localStorage['VkObserver_bitrate'] = 'enabled';
            }
            if (storVal.cache == 'enabled') {
                localStorage['VkObserver_cache'] = 'enabled';
            }
            if (storVal.bitrate == 'enabled') {
                localStorage['VkObserver_bitrate'] = 'enabled';
            }
            if (storVal.cache == 'disabled') {
                localStorage['VkObserver_cache'] = 'disabled';
            }
            if (storVal.bitrate == 'disabled') {
                localStorage['VkObserver_bitrate'] = 'disabled';
            }

        });
    },

    showAudioLinks: function(audios) {
        var audioBlocks = audios || document.querySelectorAll('.audio');
        var dragDownload = function(e) {
            var downloadLink = this.querySelector('.download-link');
            if (downloadLink.dataset) {
                e.dataTransfer.setData('DownloadURL', downloadLink.dataset.download);
            }
        };
        var noBubbling = function(event) {
            event.stopPropagation();
        };

        var getblob = function(event) {
            var el = event.target;
            var wrap = el.parentNode;
            var url = el.href;
            var downloadBtn = wrap.querySelector('.download-link');
            var cacheStatus = localStorage['VkObserver_cache'];
            if (cacheStatus == 'enabled') {
                event.preventDefault();
                event.stopPropagation();
                var winUrl = window.URL || window.webkitURL;
                var xhr = new XMLHttpRequest();
                xhr.responseType = 'blob';
                downloadBtn.style.display = 'none';
                var statusBlock = document.createElement('span');
                statusBlock.className = 'cached-status';
                wrap.appendChild(statusBlock);
                xhr.onprogress = function(completion) {
                    var cachedCompletion = Math.floor(completion.loaded / completion.total * 100);
                    var cachedPercent = cachedCompletion + '%';
                    statusBlock.innerHTML = '';
                    statusBlock.innerHTML = cachedPercent;
                    if (cachedPercent == '100%') {
                        statusBlock.remove();
                        downloadBtn.style.display = 'block';
                    }

                }
                xhr.onreadystatechange = function(response) {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        var blob = new window.Blob([this.response], {
                            'type': 'audio/mpeg'
                        });
                        var link = winUrl.createObjectURL(blob);
                        el.href = link;
                        winUrl.revokeObjectURL(blob);
                        el.click();
                        el.removeEventListener('click', getblob, false);
                    }
                }
                xhr.open('GET', url, true);
                xhr.send(null);
            } else {}

        };
        var displayBitrate = function(event) {
            event.preventDefault();
            var playBtn = event.target;
            var audioContainer = playBtn.parentNode.parentNode.parentNode.parentNode;
            var linkBtn = audioContainer.querySelector('.play_btn_wrap');
            var audioLink = linkBtn.parentNode.querySelector('input').value.split('?').splice(0, 1).toString();
            var audioDurationSeconds = audioContainer.querySelector('.duration').dataset.duration;
            var bitrateStatus = localStorage['VkObserver_bitrate'];
            var bitRate = function(callback) {
                var xmlhttp = new XMLHttpRequest();
                xmlhttp.overrideMimeType('text/xml');

                xmlhttp.onreadystatechange = function() {
                    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                        var size = xmlhttp.getResponseHeader('Content-Length');
                        var kbit = size / 128;
                        var kbps = Math.ceil(Math.round(kbit / audioDurationSeconds) / 16) * 16;
                        if (kbps > 320) {
                            kbps = 320;
                        }
                        callback(kbps);
                    }
                };
                xmlhttp.open("HEAD", audioLink, true);
                xmlhttp.send();
            };

            if (bitrateStatus == 'enabled') {
                bitRate(
                    function(response) {
                        if (!audioContainer.querySelector('.bitrate')) {
                            var text;
                            if (isNaN(response) === true) {
                                text = '×';
                            } else {
                                text = response + ' кбит/с';
                            }
                            var b = document.createElement('span');
                            b.className = 'bitrate';
                            b.innerText = text.replace('-', '');
                            audioContainer.appendChild(b);
                        }
                    });
            }
        };
        if (audioBlocks.length > 0) {
            for (var i = 0; i < audioBlocks.length; i++) {
                var audioBlock = audioBlocks[i];
                var btn = audioBlock.querySelector('.play_btn_wrap');
                if (!btn.querySelector('.download-link')) {
                    var getLink = btn.parentNode.querySelector('input').value.split('?').splice(0, 1).toString();
                    var audioTitle = audioBlock.querySelector('.title_wrap.fl_l .title').innerText;
                    var audioArtist = audioBlock.querySelector('.title_wrap.fl_l').firstElementChild.firstElementChild.innerText;
                    var audioName = audioArtist + "-" + audioTitle;
                    var audioFullName = audioName.replace('.', '');
                    var audioDurationBlock = audioBlock.querySelector('.duration');
                    var audioDurationText = audioDurationBlock.innerText.split(':');
                    var audioDurationSeconds = audioDurationText[0] * 60 + parseInt(audioDurationText[1], 10);
                    audioDurationBlock.setAttribute('data-duration', audioDurationSeconds);
                    var d = document.createElement('a');
                    d.className = 'download-link';
                    d.href = getLink;
                    d.setAttribute('download', audioFullName);
                    d.addEventListener('click', noBubbling, false);
                    d.addEventListener('click', getblob, false); //before hover cursor not pointer and opacity 0.7, after - cursor pointer/opacity 1/animation
                    audioBlock.setAttribute('draggable', 'true');
                    audioBlock.addEventListener('dragstart', dragDownload, false);
                    btn.appendChild(d);
                    audioBlock.addEventListener('mouseover', displayBitrate, false);
                }
            }
        }

    },

    downloadAll: function(entries) {

        var posts = entries || document.querySelectorAll('.post');
        var getAllAudios = function(event) {
            event.preventDefault();
            var item = event.target.parentNode;
            for (var z = 0; z < item.querySelectorAll('.audio').length; z++) {
                var ev = document.createEvent("MouseEvents");
                ev.initMouseEvent("click", true, false, self, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                item.querySelectorAll('.download-link')[z].dispatchEvent(ev);
            }
        };

        for (var i = 0; i < posts.length; i++) {
            var post = posts[i];
            var wallText = post.querySelector('.wall_text');
            if (post !== undefined && post !== null) {
                if (wallText.querySelectorAll('.audio').length > 1) {
                    var btn = document.createElement('a');
                    btn.href = '#';
                    btn.className = 'download-all-link';
                    btn.innerHTML = 'Загрузить все<span class="download-tooltip">Нажмите, чтобы загрузить все аудиозаписи</span>';
                    btn.addEventListener('click', getAllAudios, false);
                    //TODO: Deal with multi-download
                    if (!post.querySelector('.download-all-link')) {
                        wallText.appendChild(btn);
                    }
                }
            }
        }
    },

    pageMusic: function() {
        var page = document.querySelector('#page_body.fl_r');
        var pageConfig = {
            childList: true,
            subtree: true
        };

        var pageObserver = new window.WebKitMutationObserver(

            function(mutations) {
                mutations.forEach(function(mutation) {
                    var node = mutation.target;
                    var audios = node.querySelectorAll('.audio');
                    vkObserver.showAudioLinks(audios);
                    var blocks = node.querySelectorAll('.post');

                    vkObserver.downloadAll(blocks);


                });

            });

        pageObserver.observe(page, pageConfig);
    },

    bodyMedia: function() {
        var body = document.body;
        var bodyConfig = {
            childList: true,
            subtree: true
        };

        var bodyObserver = new window.WebKitMutationObserver(

            function(mutations) {
                mutations.forEach(function(mutation) {
                    var node = mutation.target;
                    var playlist = node.querySelector('#pad_playlist_panel');
                    var b = node.querySelector('#mv_layer_wrap');
                    var quality = [240, 360, 480, 720];
                    var reg = new RegExp(quality.join("|"), "i");

                    if (b) {

                        var bObserver = new window.WebKitMutationObserver(

                            function(mutations) {
                                mutations.forEach(function(mutation) {
                                    var node = mutation.target;
                                    var videoBox = node.querySelector('.video_box');

                                    if (videoBox) {
                                        var sideBar = b.querySelector('#mv_narrow');
                                        var videoTitle = b.querySelector('.mv_min_title').innerText;
                                        var el = document.createElement('div');
                                        el.className = 'arr_div';
                                        if (!sideBar.querySelector('.arr_div')) {
                                            sideBar.appendChild(el);
                                        }
                                        var html5 = videoBox.querySelector('video');
                                        var embed = videoBox.querySelector('embed');
                                        if (html5) {
                                            var sourceString = html5.getAttribute('src').split('mp4').slice(0, 1).toString() + "mp4";
                                            var videoDownload = document.createElement('a');
                                            videoDownload.className = 'html5-video';
                                            videoDownload.href = sourceString;
                                            videoDownload.setAttribute('download', videoTitle);
                                            videoDownload.innerHTML = '<span class="download-icon"></span>Загрузить видео';
                                            el.appendChild(videoDownload);
                                            //TODO: Find video quality buttons inner text
                                            //console.log(sourceString);
                                            //TODO: Create elements for all urls and push them to video links list
                                        } else {
                                            if (!embed) {
                                                return;
                                            } else {
                                                var arr = embed.getAttribute('flashvars').split('url');
                                                var newArr = arr.filter(function(arg) {
                                                    return arg.match(reg);
                                                });
                                                var filtered = newArr.join().split(/=|extra|%3F/);
                                                var urlArr = filtered.filter(function(val) {
                                                    return val.match(/http|https/);
                                                });
                                                var filteredUrlArr = urlArr.map(function(item) {
                                                    return decodeURIComponent(item);
                                                });
                                                var cleanUrlArr = filteredUrlArr.filter(function(url) {
                                                    return url.match(/mp4/);
                                                });
                                                var noDupsUrls = (function() {
                                                    var newArr = [];
                                                    for (var i = 0; i < quality.length; i++) {
                                                        var q = quality[i];
                                                        for (var k = 0; k < cleanUrlArr.length; k++) {
                                                            var a = cleanUrlArr[k];
                                                            if (a.indexOf(q) > 0) {
                                                                newArr.push(a);
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    return newArr;
                                                })();
                                                var htmlUrls = noDupsUrls.map(function(link) {
                                                    var finalVideoQuality = '';
                                                    var videoQuality = link.match(reg);
                                                    if (videoQuality == 240) {
                                                        finalVideoQuality = 'низкое (' + videoQuality + ')';
                                                    } else if (videoQuality == 360) {
                                                        finalVideoQuality = 'низкое (' + videoQuality + ')';
                                                    } else if (videoQuality == 480) {
                                                        finalVideoQuality = 'среднее (' + videoQuality + ')';
                                                    } else if (videoQuality == 720) {
                                                        finalVideoQuality = 'высокое (' + videoQuality + ')';
                                                    } else {
                                                        finalVideoQuality = videoQuality;
                                                    }

                                                    return '<li><span class="download-icon"></span><a href="' + link + '" download="' + videoTitle + '">качество - ' + finalVideoQuality + '</a></li>';
                                                });
                                                var uArr = document.createElement('ul');
                                                uArr.innerHTML = htmlUrls.join('');
                                                el.appendChild(uArr);

                                            }
                                        }
                                    }
                                });
                            });
                        var bConfig = {
                            childList: true,
                            subtree: true
                        };
                        bObserver.observe(b, bConfig);
                    }

                    if (playlist) {
                        var playlistObserver = new window.WebKitMutationObserver(

                            function(mutations) {
                                mutations.forEach(function(mutation) {
                                    var node = mutation.target;
                                    var audios = node.querySelectorAll('.audio');
                                    vkObserver.showAudioLinks(audios);
                                });
                            });
                        var playlistConfig = {
                            childList: true,
                            subtree: true
                        };
                        playlistObserver.observe(playlist, playlistConfig);
                    }


                });
            });

        bodyObserver.observe(body, bodyConfig);
    }
};

vkObserver.syncStorage();
vkObserver.showAudioLinks();
vkObserver.downloadAll();
vkObserver.pageMusic();
vkObserver.bodyMedia();