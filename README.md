# CSWIND MTO 시스템 - Save Point 87

## 🎯 프로젝트 개요
씨에스윈드 도면관리 & MTO (Make To Order) 자동화 시스템으로, Excel BOM 파일과 PDF 도면 파일을 자동으로 매칭하여 효율적인 도면 관리를 제공합니다.

## 🌐 접속 URL
- **개발 서버**: https://3000-i6ovkx4qstgf5tedcqtx9-a402f90a.sandbox.novita.ai
- **프로젝트 관리**: 상단 네비게이션 "프로젝트 관리" 탭

## ✅ 현재 완료된 기능 (Save Point 87 기준)

### 1. BOM 데이터 처리 시스템 ✅
- **Excel 헤더 분석 기반 컬럼 매핑**: 실제 Excel 구조를 동적으로 분석하여 올바른 컬럼에서 데이터 추출
- **지능형 컬럼 매핑**: 
  - **Depth** → 헤더에서 'Depth' 컬럼 자동 감지 (컬럼 위치 무관)
  - **BOMCube 파싱** → `Number/Version;Num-Name` 형식 자동 분리
    - 예: `GST08493-000/A;2-TowSct Tb TS162-01` → Number: `GST08493-000`, Version: `A`, Name: `TowSct Tb TS162-01`
  - **Name** → BOMCube에서 추출 또는 'Name' 헤더 컬럼 사용
  - **Number** → BOMCube에서 추출 또는 'Number' 헤더 컬럼 사용
  - **Version** → BOMCube에서 추출 또는 'Version'/'Rev' 헤더 컬럼 사용
  - **FindNumber** → 'FindNumber' 헤더 자동 감지 (depth 0에서는 빈값)
  - **Quantity, Unit, Weight, Material** → 각각 헤더에서 자동 감지
- **유연한 구조 지원**: Excel 컬럼 순서 변경 시에도 자동 대응

### 2. FindNumber 로직 개선 ✅
- **Depth 0 항목**: FindNumber 필드를 빈값으로 설정
- **Depth 1+ 항목**: Excel에서 FindNumber 관련 컬럼을 자동 감지하여 포지션 번호 매핑

### 3. PDF 매칭 시스템 완전 재작성 ✅
- **직접 번호 비교 방식**: 복잡한 패턴 매칭 대신 단순하고 명확한 직접 비교
- **매칭 로직**:
  - `E0005476410-00` → `E0005476410` 추출 후 PDF 파일명에 포함 여부 확인
  - `30972` → `30972`가 PDF 파일명에 포함 여부 확인
  - 모든 형태의 번호에 대해 하이픈(-) 이전 부분을 추출하여 매칭
- **대소문자 무시**: 매칭 시 대소문자를 구분하지 않음

### 4. BOM 계층 구조 및 표시 ✅
- **Depth 기반 계층**: 0~5단계 depth 지원
- **Level별 확장/축소**: L0-L5 버튼으로 레벨별 표시 제어
- **Excel 셀 스타일 보존**: 들여쓰기 정보를 Excel에서 추출하여 계층 구조 유지

### 5. 드로잉 패키지 관리 ✅
- **PDF 업로드**: 드래그 앤 드롭 또는 파일 선택으로 다중 PDF 업로드
- **자동 매칭**: BOM Number와 PDF 파일명 직접 비교로 자동 연결
- **매칭 결과 표시**: BOM 트리에서 "Drawing" 컬럼에 "보기" 버튼으로 도면 접근

## 🔧 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Tailwind CSS
- **Excel 처리**: SheetJS (XLSX)
- **아이콘**: Font Awesome
- **폰트**: Google Fonts (Inter)

## 📁 파일 구조
```
index.html              # 메인 CSWIND MTO 시스템 (프로젝트 관리 통합)
ecosystem.config.cjs    # PM2 서버 설정
css/                    # 스타일시트 디렉토리
js/                     # JavaScript 모듈 디렉토리
supplier-portal.html    # 공급업체 포털 (별도)
bom-interactive-table.html # BOM 인터랙티브 테이블 (별도)
cswind-mto-system-restructured.html # 이전 버전 백업
new_bom_processor.js    # BOM 처리 유틸리티
```

## 🚀 주요 API 및 함수

### BOM 데이터 처리
- `processBOMDataSales(rawData, worksheet, cellStyleInfo)`: Excel BOM 데이터 처리
- `buildBOMHierarchySales()`: BOM 계층 구조 생성
- `displayBOMTableSales()`: BOM 테이블 표시

### PDF 매칭 시스템
- `isNumberMatch(bomNumber, pdfFileName)`: 직접 번호 비교 매칭
- `extractDrawingNumber(filename)`: 파일명에서 도면번호 추출 (단순화됨)
- `matchDrawingsWithBOMSales()`: BOM과 PDF 자동 매칭

### 디버깅 및 테스트
- `testDrawingMatch(bomNumber, pdfFileName)`: 매칭 테스트 함수
- `window.forceMatchDrawings()`: 강제 매칭 실행
- `window.debugDrawingMap()`: 매칭 결과 디버그 출력

## 📊 데이터 모델

### BOM Item 구조
```javascript
{
    id: 'sales-bom-{index}',
    depth: 0-5,                    // 계층 깊이
    name: 'Part Name',             // 부품명
    number: 'GST03315-001',        // 도면번호
    version: 'A',                  // 버전
    findNumber: '10',              // 포지션 번호 (depth 0에서는 빈값)
    quantity: '1',                 // 수량
    unit: 'EA',                    // 단위
    weight: '10.5',                // 중량
    material: 'Steel',             // 재질
    children: [],                  // 하위 항목
    isVisible: boolean,            // 표시 여부
    hasDrawing: boolean,           // 도면 연결 여부
    drawingFile: File              // 연결된 PDF 파일
}
```

### Drawing Map 구조
```javascript
window.drawingMap = new Map([
    ['GST03315-001', {
        file: File,                // PDF 파일 객체
        fileName: 'drawing.pdf',   // 파일명
        drawingNumber: 'GST03315-001', // 도면번호
        bomNumber: 'GST03315-001', // BOM 번호
        blobUrl: 'blob:...'        // 미리보기 URL
    }]
]);
```

## 🛠️ 주요 수정사항

### Save Point 87 (2025-10-27) ⭐ 프로젝트 재진입 기능

#### 1. 시스템 등록 완료 프로젝트 재진입 가능 ✅
- **문제**: 시스템 등록을 완료한 프로젝트는 프로젝트 리스트에서 다시 열 수 없었음
- **해결**:
  - `selectProjectForAnalysis()` 함수 개선
  - BOM 데이터 자동 복원 및 계층 구조 재구성
  - 드로잉 패키지 메타데이터 복원 기능 추가
  - 시스템 등록 완료 상태 시각적 표시
- **결과**:
  - ✅ 시스템 등록 완료된 프로젝트도 더블클릭으로 재진입 가능
  - ✅ BOM 데이터, 계층 구조, 드로잉 정보 모두 복원
  - ✅ "시스템 등록 완료" 상태 메시지 표시

#### 2. 드로잉 메타데이터 복원 시스템 ✅
- **`restoreDrawingPackageMetadata()` 함수 추가**
  - localStorage에서 드로잉 메타데이터 복원
  - BOM 항목에 드로잉 파일명 매칭
  - 드로잉 연결 상태 시각적 표시
- **드로잉 셀 표시 개선**
  - 실제 파일 있음: "📄 보기" 버튼 (클릭 가능)
  - 메타데이터만 있음: "✓ 파일명..." 표시 (파일 없음 안내)
  - 드로잉 없음: "없음" 회색 텍스트

#### 3. 서버 안정성 개선 ✅
- **Python HTTP 서버 → Node.js HTTP 서버로 전환**
- **포트 충돌 문제 해결**
- **PM2 재시작 안정성 향상**

### Save Point 86 수정사항 (2025-10-27)

#### 1. 순환 참조 오류 수정 ⭐ CRITICAL FIX
- **문제**: 프로젝트 생성/등록 시 "Converting circular structure to JSON" 오류 발생
- **원인**: BOM 데이터의 parent/children 속성이 순환 참조를 형성
- **해결**:
  - `removeBOMCircularReferences()` 헬퍼 함수 추가
  - `saveProjectListToStorage()` 중앙 집중식 저장 함수 추가
  - 모든 localStorage 저장 호출을 안전한 함수로 교체
  - try-catch 오류 처리 및 사용자 피드백 추가
- **결과**: 
  - 프로젝트 생성 정상 작동 ✅
  - 시스템 등록 정상 작동 ✅
  - 데이터 무결성 보장 ✅

#### 2. 드로잉 패키지 업로드 완료 팝업 수정
- **문제**: totalBOMItems 변수 미정의로 인한 팝업 오류
- **해결**: 
  - totalBOMItems 변수 초기화 및 카운팅 로직 추가
  - Number가 있는 항목만 집계
  - 상세 디버깅 로그 추가
  - 시스템 등록 섹션 활성화 개선
- **결과**: 업로드 완료 팝업 정상 표시 ✅

#### 3. 프로젝트 관리 워크플로우 개선
- **Step 1: 프로젝트 리스트 관리**
  - 등록된 프로젝트 목록 표시
  - "+ 새 프로젝트" 버튼으로 프로젝트 생성
  - 프로젝트별 상태 표시 (BOM 분석, 도면 링크, 시스템 등록)
  - 더블클릭으로 BOM 분석 시작
  
- **Step 2: 신규 프로젝트 생성**
  - 프로젝트명, 타입, 고객사, 시작일/완료일 입력
  - 필수 항목 검증
  - 프로젝트 생성 후 자동으로 리스트에 추가
  
- **Step 3: BOM 분석 & 드로잉 패키지 업로드**
  - **BOM 분석**: Excel 파일 업로드 및 자동 파싱
  - **드로잉 패키지 업로드**: PDF 폴더 업로드 및 BOM 매칭
    - ✨ **업로드 완료 팝업 알림** (매칭 결과 상세 표시)
    - ✨ **도면링크 상태 자동 '완료' 변경**
    - ✨ **시스템 등록 섹션 자동 활성화**
  
- **시스템 등록 (Step 3 하단에 추가)** ✨
  - BOM 분석 + 도면 링크 완료 시 나타남
  - 3단계 진행 상황 표시 (BOM 분석 ✅ / 도면 링크 ✅ / 시스템 등록 ⏳)
  - "시스템에 등록하기" 버튼 클릭 시:
    - 프로젝트 상태 최종 업데이트
    - 로컬 스토리지에 저장
    - 성공 알림 팝업
    - 자동으로 프로젝트 리스트로 이동
    
- **프로젝트 리스트 상태 표시**
  - BOM 분석: ✅ 완료 / ⊖ 미완료
  - 도면 링크: ✅ 완료 / ⊖ 미완료
  - 시스템 등록: ✅ 완료 / ⏳ 대기 / ⊖ 미완료

#### 2. Excel Depth 컬럼 파싱 오류 수정
- **문제**: Excel 원본에서 Depth 값이 0~5로 다양하지만, 파싱 결과는 모두 0으로 표시되어 토글 기능이 작동하지 않음
- **원인**: 하드코딩된 컬럼 인덱스(0번 컬럼)를 사용하여 Depth를 읽었으나, 실제 Excel에서는 Depth가 3번 컬럼에 위치
- **해결**: 
  - Excel 헤더를 동적으로 분석하여 'Depth' 컬럼 자동 감지
  - BOMCube 컬럼 파싱: `Number/Version;Num-Name` 형식 분리 (예: `GST08493-000/A;2-TowSct Tb TS162-01`)
  - 모든 필수 컬럼(Depth, Name, Number, Version, FindNumber 등)을 헤더 기반으로 매핑
  - 유연한 Excel 구조 지원: 컬럼 순서가 변경되어도 자동 대응
- **결과**: 
  - Depth 값이 정확히 파싱되어 BOM 트리 계층 구조 정상 표시
  - 토글 기능 완전 복구: 각 레벨의 확장/축소 정상 작동
  - Excel 구조 변경에 강건한 시스템 구축

#### 2. BOM 트리 토글 기능 수정
- **문제**: Depth에 따른 토글 아이콘이 클릭되지 않는 문제
- **원인**: `innerHTML`로 생성된 `onclick` 속성이 제대로 바인딩되지 않음
- **해결**: 
  - `onclick` 속성 대신 `data-item-id` 속성 사용
  - JavaScript `addEventListener`로 직접 이벤트 바인딩
  - 토글 아이콘 클릭 시 정상 작동 확인
- **개선**:
  - 토글 실행 시 상세 디버깅 로그 추가
  - 아이템 정보, 자식 개수, 표시/숨김 상태 콘솔 출력
  - 사용자가 문제 발생 시 쉽게 추적 가능

#### 2. PDF 미리보기 로딩 문제 해결
- **문제**: PDF 미리보기가 로딩되지 않는 문제
- **해결**:
  - `<embed>` 태그에서 `<iframe>` 태그로 변경하여 브라우저 호환성 향상
  - PDF 로딩 파라미터 추가 (`#toolbar=1&navpanes=1&scrollbar=1`)
  - PDF 표시 실패 시 다운로드 링크 제공하는 폴백 메시지 추가
  - 디버깅을 위한 콘솔 로그 추가
  - 배경색 추가로 로딩 상태 시각적 피드백 개선

### Save Point 86

#### 1. BOM 컬럼 매핑 정확성 수정
- **문제**: FindNumber 컬럼에 Quantity 값이, Number 컬럼에 FindNumber 값이 잘못 매핑됨
- **해결**: Excel 헤더 분석을 통해 정확한 컬럼 위치 자동 감지
- **결과**: GST03315-001, E0005030033 등 실제 도면번호가 Number 컬럼에 정확히 표시

#### 2. PDF 매칭 로직 완전 재작성
- **기존**: 복잡한 정규식 패턴 매칭 및 E-pattern 분석
- **신규**: 직접 문자열 포함 여부 비교
- **예시**: 
  - BOM: `E0005476410-00` → PDF파일명에 `E0005476410` 포함 여부 확인
  - BOM: `30972` → PDF파일명에 `30972` 포함 여부 확인

#### 3. FindNumber 로직 개선
- **Depth 0 항목**: 자동으로 FindNumber 필드를 빈값으로 설정
- **Depth 1+ 항목**: Excel에서 FindNumber 관련 헤더를 자동 감지하여 매핑

## 🧪 테스트 가이드

### 개발자 도구에서 테스트
```javascript
// PDF 매칭 테스트
testDrawingMatch('E0005476410-00', 'E0005476410_drawing.pdf');
testDrawingMatch('30972', '30972-Rev1.pdf');

// 강제 매칭 실행
forceMatchDrawings();

// 매칭 결과 디버그
debugDrawingMap();
```

## 🔄 워크플로우

1. **BOM Excel 파일 업로드**: SheetJS로 파싱하여 컬럼 매핑
2. **PDF 드로잉 패키지 업로드**: 다중 PDF 파일 업로드
3. **자동 매칭**: 직접 번호 비교로 BOM-PDF 연결
4. **BOM 트리 표시**: 계층구조 및 도면 링크가 포함된 테이블 렌더링
5. **도면 보기**: "보기" 버튼으로 연결된 PDF 도면 확인

## 📋 향후 개발 계획

### 우선순위 높음
- [ ] 매칭 정확도 향상을 위한 추가 테스트 케이스 확장
- [ ] BOM 데이터 내보내기 기능 (Excel/CSV)
- [ ] 도면 미리보기 화면 개선

### 우선순위 중간
- [ ] 사용자 설정 가능한 컬럼 매핑 UI
- [ ] 매칭 결과 통계 대시보드
- [ ] PDF 주석 기능

### 우선순위 낮음
- [ ] 다국어 지원
- [ ] 모바일 반응형 최적화
- [ ] 클라우드 저장소 연동

## 🎉 성과

### 문제 해결 완료
- ✅ BOM Number 컬럼에 올바른 도면번호 표시 (GST03315-001, E0005030033 등)
- ✅ FindNumber 컬럼에 올바른 포지션 번호 표시 (10, 20, 30 등)
- ✅ Depth 0 항목의 FindNumber 자동 공백 처리
- ✅ PDF 매칭 성공률 향상 (직접 비교 방식)

### 시스템 안정성 향상
- ✅ Excel 구조 변경에 대한 유연한 대응 (헤더 분석 기반)
- ✅ 단순화된 PDF 매칭 로직으로 유지보수성 향상
- ✅ 명확한 디버깅 및 테스트 도구 제공

---

**최종 업데이트**: 2025-10-27
**버전**: Save Point 87
**상태**: 운영 준비 완료 ✅

## 📝 다음 개발 계획

### 우선순위: 높음
- [ ] **프로젝트 편집 기능**: 등록된 프로젝트의 정보(이름, 고객사, 날짜 등) 수정 기능
- [ ] **프로젝트 삭제 기능**: 불필요한 프로젝트 삭제 및 데이터 정리
- [ ] **드로잉 파일 재업로드**: 시스템 등록 후에도 드로잉 파일 추가/교체 가능

### 우선순위: 중간
- [ ] **BOM 데이터 내보내기**: Excel/CSV 형식으로 내보내기
- [ ] **프로젝트 검색 및 필터링**: 프로젝트명, 고객사, 날짜로 검색
- [ ] **드로잉 미리보기 개선**: 확대/축소, 페이지 이동 등 뷰어 기능 강화