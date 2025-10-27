// 유틸리티 함수들

// 날짜 관련 유틸리티
const DateUtils = {
    formatKorean: (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    formatDateTime: (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatRelative: (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (days > 0) return `${days}일 전`;
        if (hours > 0) return `${hours}시간 전`;
        if (minutes > 0) return `${minutes}분 전`;
        return '방금 전';
    },

    getCurrentDateTime: () => {
        return new Date().toISOString();
    }
};

// 숫자 포맷팅 유틸리티
const NumberUtils = {
    format: (number) => {
        if (typeof number !== 'number' || isNaN(number)) return '-';
        return new Intl.NumberFormat('ko-KR').format(number);
    },

    formatWeight: (weight) => {
        if (typeof weight !== 'number' || isNaN(weight)) return '-';
        if (weight >= 1000) {
            return `${(weight / 1000).toFixed(1)}톤`;
        }
        return `${weight}kg`;
    },

    formatCurrency: (amount) => {
        if (typeof amount !== 'number' || isNaN(amount)) return '-';
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    },

    parseNumber: (str) => {
        if (!str) return 0;
        return parseFloat(str.toString().replace(/[^\d.-]/g, '')) || 0;
    }
};

// 문자열 유틸리티
const StringUtils = {
    truncate: (str, maxLength = 50) => {
        if (!str || str.length <= maxLength) return str || '';
        return str.substring(0, maxLength) + '...';
    },

    slugify: (str) => {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/[^a-z0-9\u3131-\uD79D]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    },

    capitalize: (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    isEmpty: (str) => {
        return !str || str.trim().length === 0;
    },

    generateId: () => {
        return 'csw_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
};

// 배열 유틸리티
const ArrayUtils = {
    groupBy: (array, key) => {
        return array.reduce((groups, item) => {
            const group = item[key];
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        }, {});
    },

    sortBy: (array, key, direction = 'asc') => {
        return [...array].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    },

    filterBy: (array, filters) => {
        return array.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                const itemValue = item[key];
                if (typeof itemValue === 'string') {
                    return itemValue.toLowerCase().includes(value.toLowerCase());
                }
                return itemValue === value;
            });
        });
    },

    paginate: (array, page = 1, limit = 10) => {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        return {
            data: array.slice(startIndex, endIndex),
            total: array.length,
            page: page,
            totalPages: Math.ceil(array.length / limit),
            hasNext: endIndex < array.length,
            hasPrev: page > 1
        };
    }
};

// DOM 유틸리티
const DOMUtils = {
    createElement: (tag, className = '', innerHTML = '', attributes = {}) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        
        return element;
    },

    show: (element) => {
        if (element) element.classList.remove('hidden');
    },

    hide: (element) => {
        if (element) element.classList.add('hidden');
    },

    toggle: (element) => {
        if (element) element.classList.toggle('hidden');
    },

    empty: (element) => {
        if (element) element.innerHTML = '';
    },

    findParent: (element, selector) => {
        let parent = element.parentElement;
        while (parent && !parent.matches(selector)) {
            parent = parent.parentElement;
        }
        return parent;
    }
};

// 로컬 스토리지 유틸리티
const StorageUtils = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('로컬 스토리지 저장 실패:', error);
        }
    },

    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('로컬 스토리지 읽기 실패:', error);
            return defaultValue;
        }
    },

    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('로컬 스토리지 삭제 실패:', error);
        }
    },

    clear: () => {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('로컬 스토리지 초기화 실패:', error);
        }
    }
};

// 파일 업로드 유틸리티
const FileUtils = {
    readCSV: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const csv = event.target.result;
                    const lines = csv.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim());
                    
                    const data = lines.slice(1)
                        .filter(line => line.trim())
                        .map(line => {
                            const values = line.split(',').map(v => v.trim());
                            const row = {};
                            headers.forEach((header, index) => {
                                row[header] = values[index] || '';
                            });
                            return row;
                        });
                    
                    resolve({ headers, data });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsText(file, 'utf-8');
        });
    },

    readExcel: (file) => {
        // 실제 구현에서는 SheetJS 등의 라이브러리 필요
        return new Promise((resolve, reject) => {
            reject(new Error('Excel 파일 처리 라이브러리가 필요합니다.'));
        });
    },

    downloadCSV: (data, filename = 'export.csv') => {
        if (!data || data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => `"${row[header] || ''}"`).join(',')
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    downloadJSON: (data, filename = 'export.json') => {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    validateFileType: (file, allowedTypes = []) => {
        if (allowedTypes.length === 0) return true;
        return allowedTypes.some(type => {
            if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type.toLowerCase());
            }
            return file.type.includes(type);
        });
    },

    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// 검색 및 필터링 유틸리티
const SearchUtils = {
    createSearchHandler: (data, searchFields, onResult) => {
        return (searchTerm) => {
            if (!searchTerm || searchTerm.trim() === '') {
                onResult(data);
                return;
            }
            
            const term = searchTerm.toLowerCase();
            const filtered = data.filter(item => {
                return searchFields.some(field => {
                    const value = item[field];
                    if (typeof value === 'string') {
                        return value.toLowerCase().includes(term);
                    }
                    if (typeof value === 'number') {
                        return value.toString().includes(term);
                    }
                    return false;
                });
            });
            
            onResult(filtered);
        };
    },

    highlightSearchTerm: (text, searchTerm) => {
        if (!searchTerm || !text) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
    },

    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// 유효성 검사 유틸리티
const ValidationUtils = {
    isEmail: (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    isPhoneNumber: (phone) => {
        const regex = /^[\d\-\+\(\)\s]+$/;
        return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    },

    isRequired: (value) => {
        return value !== null && value !== undefined && String(value).trim() !== '';
    },

    isNumber: (value) => {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    isPositiveNumber: (value) => {
        return ValidationUtils.isNumber(value) && parseFloat(value) > 0;
    },

    minLength: (value, min) => {
        return String(value).length >= min;
    },

    maxLength: (value, max) => {
        return String(value).length <= max;
    },

    validateForm: (formData, rules) => {
        const errors = {};
        
        Object.entries(rules).forEach(([field, fieldRules]) => {
            const value = formData[field];
            
            fieldRules.forEach(rule => {
                if (typeof rule === 'function') {
                    const result = rule(value);
                    if (result !== true) {
                        if (!errors[field]) errors[field] = [];
                        errors[field].push(result);
                    }
                } else if (typeof rule === 'object') {
                    const { validator, message } = rule;
                    if (!validator(value)) {
                        if (!errors[field]) errors[field] = [];
                        errors[field].push(message);
                    }
                }
            });
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// 차트 데이터 유틸리티
const ChartUtils = {
    generateColors: (count) => {
        const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
            '#6366f1', '#ec4899', '#14b8a6', '#eab308'
        ];
        
        return Array(count).fill().map((_, i) => colors[i % colors.length]);
    },

    prepareDonutData: (data, labelKey, valueKey) => {
        return {
            labels: data.map(item => item[labelKey]),
            datasets: [{
                data: data.map(item => item[valueKey]),
                backgroundColor: ChartUtils.generateColors(data.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    },

    prepareBarData: (data, labelKey, valueKey, label = '데이터') => {
        return {
            labels: data.map(item => item[labelKey]),
            datasets: [{
                label: label,
                data: data.map(item => item[valueKey]),
                backgroundColor: ChartUtils.generateColors(data.length),
                borderColor: ChartUtils.generateColors(data.length),
                borderWidth: 1
            }]
        };
    },

    prepareLineData: (data, labelKey, valueKey, label = '데이터') => {
        return {
            labels: data.map(item => item[labelKey]),
            datasets: [{
                label: label,
                data: data.map(item => item[valueKey]),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };
    }
};

// 전역으로 유틸리티 함수들 노출
window.DateUtils = DateUtils;
window.NumberUtils = NumberUtils;
window.StringUtils = StringUtils;
window.ArrayUtils = ArrayUtils;
window.DOMUtils = DOMUtils;
window.StorageUtils = StorageUtils;
window.FileUtils = FileUtils;
window.SearchUtils = SearchUtils;
window.ValidationUtils = ValidationUtils;
window.ChartUtils = ChartUtils;