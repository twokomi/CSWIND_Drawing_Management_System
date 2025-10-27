// 데이터 검증 및 에러 처리 시스템

class ValidationManager {
    constructor(app) {
        this.app = app;
        this.validationRules = this.setupValidationRules();
        this.init();
    }

    init() {
        // 폼 검증 이벤트 리스너 설정
        this.setupFormValidation();
        
        // 실시간 검증 설정
        this.setupRealTimeValidation();
    }

    setupValidationRules() {
        return {
            project: {
                customer_name: {
                    required: true,
                    minLength: 2,
                    maxLength: 100,
                    pattern: /^[가-힣a-zA-Z0-9\s\-_().&]+$/,
                    message: '고객사명은 2-100자의 한글, 영문, 숫자, 특수문자(.,-,_,(,),&)만 허용됩니다.'
                },
                tower_model: {
                    required: true,
                    minLength: 3,
                    maxLength: 50,
                    pattern: /^[A-Z0-9\-_.]+$/,
                    message: '타워모델은 3-50자의 영문 대문자, 숫자, 하이픈, 언더스코어만 허용됩니다.'
                },
                project_description: {
                    maxLength: 500,
                    message: '프로젝트 설명은 최대 500자까지 입력 가능합니다.'
                }
            },
            
            bomItem: {
                drawing_number: {
                    required: true,
                    pattern: /^[A-Z0-9\-_]+$/,
                    message: '도면번호는 영문 대문자, 숫자, 하이픈, 언더스코어만 허용됩니다.'
                },
                item_name: {
                    required: true,
                    minLength: 2,
                    maxLength: 200,
                    message: '아이템명은 2-200자여야 합니다.'
                },
                weight: {
                    type: 'number',
                    min: 0,
                    max: 1000000,
                    message: '무게는 0-1,000,000kg 범위여야 합니다.'
                },
                quantity: {
                    type: 'number',
                    min: 1,
                    max: 99999,
                    message: '수량은 1-99,999 범위의 정수여야 합니다.'
                }
            },
            
            supplier: {
                supplier_name: {
                    required: true,
                    minLength: 2,
                    maxLength: 100,
                    pattern: /^[가-힣a-zA-Z0-9\s\-_().&]+$/,
                    message: '서플라이어명은 2-100자의 한글, 영문, 숫자, 특수문자만 허용됩니다.'
                },
                contact_info: {
                    pattern: /^([0-9\-\(\)\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/,
                    message: '올바른 전화번호 또는 이메일 형식을 입력하세요.'
                },
                weight_capacity: {
                    type: 'number',
                    min: 0,
                    max: 10000000,
                    message: '처리 중량은 0-10,000톤 범위여야 합니다.'
                }
            }
        };
    }

    setupFormValidation() {
        // 모든 폼에 submit 이벤트 리스너 추가
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (!this.validateForm(form)) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    setupRealTimeValidation() {
        // 입력 필드에 실시간 검증 이벤트 추가
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.validateField(e.target);
            }
        });

        document.addEventListener('blur', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.validateField(e.target);
            }
        });
    }

    validateForm(form) {
        const formId = form.id;
        let isValid = true;
        const errors = [];

        // 폼별 특별한 검증 규칙 적용
        switch (formId) {
            case 'new-project-form':
                isValid = this.validateProjectForm(form, errors);
                break;
            case 'manual-bom-form':
                isValid = this.validateBOMForm(form, errors);
                break;
            case 'add-supplier-form':
                isValid = this.validateSupplierForm(form, errors);
                break;
        }

        if (!isValid) {
            this.showValidationErrors(errors);
        }

        return isValid;
    }

    validateProjectForm(form, errors) {
        const formData = new FormData(form);
        let isValid = true;

        // 고객사명 검증
        const customerName = formData.get('customer_name') || document.getElementById('customer-name')?.value;
        if (!this.validateField(customerName, this.validationRules.project.customer_name)) {
            errors.push(this.validationRules.project.customer_name.message);
            isValid = false;
        }

        // 타워모델 검증
        const towerModel = formData.get('tower_model') || document.getElementById('tower-model')?.value;
        if (!this.validateField(towerModel, this.validationRules.project.tower_model)) {
            errors.push(this.validationRules.project.tower_model.message);
            isValid = false;
        }

        // 중복 프로젝트명 체크
        const projectName = `${customerName}-${towerModel}`;
        if (this.app.projects.some(p => p.project_name === projectName)) {
            errors.push('동일한 프로젝트명이 이미 존재합니다.');
            isValid = false;
        }

        return isValid;
    }

    validateBOMForm(form, errors) {
        const formData = new FormData(form);
        let isValid = true;

        const drawingNumber = formData.get('drawing_number') || document.getElementById('manual-drawing-number')?.value;
        if (!this.validateField(drawingNumber, this.validationRules.bomItem.drawing_number)) {
            errors.push(this.validationRules.bomItem.drawing_number.message);
            isValid = false;
        }

        const itemName = formData.get('item_name') || document.getElementById('manual-item-name')?.value;
        if (!this.validateField(itemName, this.validationRules.bomItem.item_name)) {
            errors.push(this.validationRules.bomItem.item_name.message);
            isValid = false;
        }

        return isValid;
    }

    validateSupplierForm(form, errors) {
        const formData = new FormData(form);
        let isValid = true;

        const supplierName = formData.get('supplier_name');
        if (!this.validateField(supplierName, this.validationRules.supplier.supplier_name)) {
            errors.push(this.validationRules.supplier.supplier_name.message);
            isValid = false;
        }

        // 중복 서플라이어명 체크
        if (this.app.suppliers.some(s => s.supplier_name === supplierName)) {
            errors.push('동일한 서플라이어명이 이미 존재합니다.');
            isValid = false;
        }

        const contactInfo = formData.get('contact_info');
        if (contactInfo && !this.validateField(contactInfo, this.validationRules.supplier.contact_info)) {
            errors.push(this.validationRules.supplier.contact_info.message);
            isValid = false;
        }

        return isValid;
    }

    validateField(value, rule) {
        if (!rule) return true;

        // 필수 필드 검증
        if (rule.required && (!value || value.toString().trim() === '')) {
            return false;
        }

        // 값이 없고 필수가 아니면 통과
        if (!value || value.toString().trim() === '') {
            return true;
        }

        const stringValue = value.toString().trim();

        // 최소 길이 검증
        if (rule.minLength && stringValue.length < rule.minLength) {
            return false;
        }

        // 최대 길이 검증
        if (rule.maxLength && stringValue.length > rule.maxLength) {
            return false;
        }

        // 패턴 검증
        if (rule.pattern && !rule.pattern.test(stringValue)) {
            return false;
        }

        // 숫자 타입 검증
        if (rule.type === 'number') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return false;
            
            if (rule.min !== undefined && numValue < rule.min) return false;
            if (rule.max !== undefined && numValue > rule.max) return false;
        }

        return true;
    }

    validateField(element) {
        if (!element || !element.name) return;

        const value = element.value;
        const fieldName = element.name;
        let rule = null;

        // 필드명에서 검증 규칙 찾기
        for (const [category, rules] of Object.entries(this.validationRules)) {
            if (rules[fieldName]) {
                rule = rules[fieldName];
                break;
            }
        }

        if (!rule) return;

        const isValid = this.validateField(value, rule);
        
        // 기존 에러 메시지 제거
        this.clearFieldError(element);

        if (!isValid) {
            this.showFieldError(element, rule.message);
        }
    }

    showFieldError(element, message) {
        element.classList.add('border-red-500', 'bg-red-50');
        element.classList.remove('border-gray-300');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-red-600 text-xs mt-1';
        errorDiv.textContent = message;
        errorDiv.id = `error-${element.name}`;

        const parent = element.parentElement;
        parent.appendChild(errorDiv);
    }

    clearFieldError(element) {
        element.classList.remove('border-red-500', 'bg-red-50');
        element.classList.add('border-gray-300');

        const existingError = document.getElementById(`error-${element.name}`);
        if (existingError) {
            existingError.remove();
        }
    }

    showValidationErrors(errors) {
        if (errors.length === 0) return;

        const errorMessage = errors.length === 1 
            ? errors[0] 
            : `다음 ${errors.length}개의 문제를 수정해주세요:\n• ${errors.join('\n• ')}`;

        this.app.showToast(errorMessage, 'error', 7000);
    }

    // 파일 업로드 검증
    validateFileUpload(file, allowedTypes = [], maxSize = 10 * 1024 * 1024) {
        const errors = [];

        // 파일 존재 확인
        if (!file) {
            errors.push('파일을 선택해주세요.');
            return { isValid: false, errors };
        }

        // 파일 크기 검증
        if (file.size > maxSize) {
            errors.push(`파일 크기는 ${FileUtils.formatFileSize(maxSize)} 이하여야 합니다.`);
        }

        // 파일 타입 검증
        if (allowedTypes.length > 0 && !FileUtils.validateFileType(file, allowedTypes)) {
            errors.push(`허용된 파일 형식: ${allowedTypes.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // CSV 데이터 검증
    validateCSVData(csvData, requiredColumns = []) {
        const errors = [];

        if (!csvData || !csvData.data || csvData.data.length === 0) {
            errors.push('CSV 파일에 데이터가 없습니다.');
            return { isValid: false, errors };
        }

        // 필수 컬럼 확인
        const headers = csvData.headers || Object.keys(csvData.data[0] || {});
        const missingColumns = requiredColumns.filter(col => 
            !headers.some(header => 
                header.toLowerCase().includes(col.toLowerCase()) ||
                col.toLowerCase().includes(header.toLowerCase())
            )
        );

        if (missingColumns.length > 0) {
            errors.push(`필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}`);
        }

        // 데이터 행 검증
        let invalidRows = 0;
        csvData.data.forEach((row, index) => {
            const rowErrors = [];
            
            // 빈 행 체크
            const hasData = Object.values(row).some(value => value && value.toString().trim() !== '');
            if (!hasData) {
                invalidRows++;
                return;
            }

            // 각 필드별 기본 검증
            Object.entries(row).forEach(([key, value]) => {
                if (key.toLowerCase().includes('weight') || key.toLowerCase().includes('무게')) {
                    const numValue = NumberUtils.parseNumber(value);
                    if (value && (isNaN(numValue) || numValue < 0)) {
                        rowErrors.push(`${index + 2}행: 무게 값이 올바르지 않습니다 (${value})`);
                    }
                }
            });

            if (rowErrors.length > 0) {
                errors.push(...rowErrors);
                invalidRows++;
            }
        });

        if (invalidRows > csvData.data.length * 0.5) {
            errors.push(`너무 많은 행에 오류가 있습니다 (${invalidRows}/${csvData.data.length}행)`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            validRows: csvData.data.length - invalidRows
        };
    }

    // 데이터 무결성 검증
    validateDataIntegrity() {
        const issues = [];

        // 프로젝트-BOM 연관성 검증
        const orphanedBOM = this.app.bomItems.filter(item => 
            !this.app.projects.some(project => project.id === item.project_id)
        );
        if (orphanedBOM.length > 0) {
            issues.push(`${orphanedBOM.length}개의 BOM 아이템이 존재하지 않는 프로젝트를 참조합니다.`);
        }

        // MTO-프로젝트 연관성 검증
        const orphanedMTO = this.app.mtoPackages.filter(mto => 
            !this.app.projects.some(project => project.id === mto.project_id)
        );
        if (orphanedMTO.length > 0) {
            issues.push(`${orphanedMTO.length}개의 MTO 패키지가 존재하지 않는 프로젝트를 참조합니다.`);
        }

        // MTO-서플라이어 연관성 검증
        const invalidMTOSuppliers = this.app.mtoPackages.filter(mto => 
            !this.app.suppliers.some(supplier => supplier.id === mto.supplier_id)
        );
        if (invalidMTOSuppliers.length > 0) {
            issues.push(`${invalidMTOSuppliers.length}개의 MTO 패키지가 존재하지 않는 서플라이어를 참조합니다.`);
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }
}

// 전역 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.csWindApp) {
            window.validationManager = new ValidationManager(window.csWindApp);
        }
    }, 100);
});