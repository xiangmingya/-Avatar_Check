 // Define service providers globally or within a scope accessible to the populating function
        const serviceProviders = [
            { name: 'Cravatar', value: 'cravatar', url: 'https://cravatar.cn/' },
            { name: 'Gravatar', value: 'gravatar', url: 'https://www.gravatar.com/' },
            { name: 'WeAvatar', value: 'weavatar', url: 'https://weavatar.com/' },
            { name: 'Libravatar', value: 'libravatar', url: 'https://www.libravatar.org/' }
            // Add other providers here if they are in the select dropdown
        ];

        window.onload = function() {
            // Check if jQuery is loaded
            if (typeof jQuery === 'undefined') {
                console.error('jQuery 加载失败，请刷新页面重试');
                document.body.innerHTML = '<p style="color:red; text-align:center; padding-top: 50px;">关键组件加载失败，请检查网络连接并刷新页面。</p>';
                return;
            }
            // Check if md5 library is loaded
            if (typeof md5 === 'undefined') {
                console.error('MD5 库加载失败，请刷新页面重试');
                document.body.innerHTML = '<p style="color:red; text-align:center; padding-top: 50px;">关键组件加载失败，请检查网络连接并刷新页面。</p>';
                return;
            }

            // Populate footer with service provider links
            const serviceListFooter = document.getElementById('serviceProviderListFooter');
            if (serviceListFooter) {
                serviceProviders.forEach(provider => {
                    const listItem = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = provider.url;
                    link.textContent = provider.name;
                    link.target = "_blank"; // Open in new tab
                    link.rel = "noopener noreferrer";
                    listItem.appendChild(link);
                    serviceListFooter.appendChild(listItem);
                });
            }


            $(document).ready(function() {
                const emailInput = $("#email");
                const checkBtn = $("#check-btn");
                const avatarSizeSelect = $("#avatar-size");
                const avatarServiceSelect = $("#avatar-service"); // This is the select dropdown
                const emailHashSpan = $("#email-hash");
                const gravatarUrlSpan = $("#gravatar-url");
                const copyHashBtn = $("#copy-hash-btn");
                const copyUrlBtn = $("#copy-url-btn");
                const statusMessageDiv = $("#status-message");
                const avatarDisplaySection = $("#avatarDisplaySection");
                const displayedAvatarImg = $("#displayedAvatar");
                let statusClearTimeout; 

                // Simple regex for email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                function showStatus(message, type = "info") {
                    clearTimeout(statusClearTimeout); 
                    statusMessageDiv.text(message)
                                  .removeClass('success error info status-visible') 
                                  .addClass(type) 
                                  .addClass('status-visible'); 
                }

                function hideStatus() {
                    statusMessageDiv.removeClass('status-visible'); 
                    clearTimeout(statusClearTimeout);
                    statusClearTimeout = setTimeout(() => {
                        if (!statusMessageDiv.hasClass('status-visible')) {
                            statusMessageDiv.text('');
                        }
                    }, 400); 
                }

                function resetResults() {
                    emailHashSpan.text('');
                    gravatarUrlSpan.text('');
                    copyHashBtn.text("复制Hash").prop("disabled", true).removeClass('copied');
                    copyUrlBtn.text("复制URL").prop("disabled", true).removeClass('copied');
                    avatarDisplaySection.hide(); 
                    displayedAvatarImg.attr('src', '#').hide();
                }
                resetResults(); // Initial reset

                emailInput.on('input', function() {
                    if (!$(this).val().trim()) {
                        resetResults(); 
                        hideStatus();   
                    }
                });

                checkBtn.click(function(event) {
                    event.preventDefault();
                    let email = emailInput.val().trim();
                    // Get the value of the selected option (e.g., "cravatar", "gravatar")
                    let selectedServiceValue = avatarServiceSelect.val(); 

                    hideStatus(); 
                    emailHashSpan.text('');
                    gravatarUrlSpan.text('');
                    avatarDisplaySection.hide(); 
                    displayedAvatarImg.attr('src', '#').hide();
                    copyHashBtn.text("复制Hash").prop("disabled", true).removeClass('copied');
                    copyUrlBtn.text("复制URL").prop("disabled", true).removeClass('copied');

                    if (!email) {
                        showStatus("请输入邮箱地址", "error");
                        return;
                    }
                    if (!emailRegex.test(email)) {
                        showStatus("输入不是邮箱格式", "error"); 
                        return;
                    }

                    checkBtn.prop("disabled", true).text("检查中...");

                    let emailProcessed = email.toLowerCase();
                    let emailHash = md5(emailProcessed);
                    emailHashSpan.text(emailHash);
                    copyHashBtn.prop("disabled", false);

                    // Find the selected provider object from the global serviceProviders array
                    const selectedProvider = serviceProviders.find(p => p.value === selectedServiceValue);
                    let baseUrl = "";
                    let serviceName = "未知服务";

                    if (selectedProvider) {
                        // Construct base URL by removing the filename if it's a full path
                        // For Gravatar-like services, the base URL is usually up to /avatar/
                        // Example: https://cravatar.cn/ -> https://cravatar.cn/avatar/
                        // Example: https://www.gravatar.com/ -> https://www.gravatar.com/avatar/
                        let tempUrl = selectedProvider.url;
                        if (!tempUrl.endsWith('/')) {
                            tempUrl += '/';
                        }
                        // Ensure it's the root domain or a path that makes sense for an avatar service
                        if (tempUrl.match(/^https?:\/\/[^\/]+\/?$/) || tempUrl.includes('gravatar.com') || tempUrl.includes('cravatar.cn') || tempUrl.includes('weavatar.com') || tempUrl.includes('libravatar.org')) {
                             baseUrl = tempUrl + 'avatar/';
                        } else {
                            // Fallback for unexpected URL structures, try to derive intelligently
                            let urlParts = selectedProvider.url.split('/');
                            if (urlParts[urlParts.length -1].includes('.')) { 
                                urlParts.pop();
                            }
                            baseUrl = urlParts.join('/') + (urlParts[urlParts.length-1] === '' ? 'avatar/' : '/avatar/');
                        }
                        serviceName = selectedProvider.name;

                    } else {
                        // Fallback or error handling if service not found
                        console.error("Selected service provider not found in definitions.");
                        baseUrl = "https://cravatar.cn/avatar/"; // Default fallback
                        serviceName = avatarServiceSelect.find("option:selected").text(); 
                    }
                    
                    // Ensure baseUrl ends with a slash
                    if (!baseUrl.endsWith('/')) {
                        baseUrl += '/';
                    }


                    let queryParamForSize = 's'; // Default for Gravatar-like
                    // Libravatar uses 'size' instead of 's'
                    if (selectedServiceValue === 'libravatar') {
                        queryParamForSize = 'size';
                    }


                    let gravatarDisplayUrl = `${baseUrl}${emailHash}?${queryParamForSize}=${avatarSizeSelect.val()}&d=404`;
                    gravatarUrlSpan.text(gravatarDisplayUrl);
                    copyUrlBtn.prop("disabled", false);

                    let img = new Image();
                    img.src = gravatarDisplayUrl;
                    
                    // Add a timeout for image loading
                    let imageLoadTimeout = setTimeout(() => {
                        img.onload = null; // Prevent late firing
                        img.onerror = null; // Prevent late firing
                        showStatus(`加载 ${serviceName} 头像超时或服务不可用。`, "error");
                        checkBtn.prop("disabled", false).text("检查头像");
                    }, 8000); // 8 seconds timeout


                    img.onload = function() {
                        clearTimeout(imageLoadTimeout);
                        displayedAvatarImg.attr('src', gravatarDisplayUrl).show();
                        avatarDisplaySection.show(); 
                        showStatus(`该邮箱在 ${serviceName} 上已设置头像！`, "success");
                        checkBtn.prop("disabled", false).text("检查头像");
                    };

                    img.onerror = function() {
                        clearTimeout(imageLoadTimeout);
                        showStatus(`该邮箱在 ${serviceName} 上尚未设置头像，或服务不可用/返回404。`, "error");
                        checkBtn.prop("disabled", false).text("检查头像");
                    };
                });

                function copyToClipboard(text, buttonElement) {
                    if (!navigator.clipboard) {
                        let textArea = document.createElement("textarea");
                        textArea.value = text;
                        textArea.style.position = "fixed"; // Prevent scrolling to bottom
                        textArea.style.left = "-9999px"; // Move off-screen
                        textArea.style.top = "0";
                        textArea.style.opacity = "0";
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        try {
                            document.execCommand('copy');
                            $(buttonElement).text("已复制!").addClass('copied');
                            setTimeout(function() {
                                $(buttonElement).text($(buttonElement).attr('id') === 'copy-hash-btn' ? "复制Hash" : "复制URL").removeClass('copied');
                            }, 2000);
                        } catch (err) {
                            showStatus('复制失败 (fallback)', 'error');
                        }
                        document.body.removeChild(textArea);
                        return;
                    }
                    navigator.clipboard.writeText(text).then(function() {
                        $(buttonElement).text("已复制!").addClass('copied');
                        setTimeout(function() {
                             $(buttonElement).text($(buttonElement).attr('id') === 'copy-hash-btn' ? "复制Hash" : "复制URL").removeClass('copied');
                        }, 2000);
                    }, function(err) {
                        showStatus('复制失败: ' + err, 'error');
                    });
                }

                copyHashBtn.click(function() {
                    if (emailHashSpan.text()) {
                        copyToClipboard(emailHashSpan.text(), this);
                    }
                });

                copyUrlBtn.click(function() {
                    if (gravatarUrlSpan.text()) {
                        copyToClipboard(gravatarUrlSpan.text(), this);
                    }
                });
            });
        };
