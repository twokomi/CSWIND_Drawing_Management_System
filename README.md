# CSWIND MTO 시스템 - Save Point 86 복원 완료

## 🎯 프로젝트 개요
씨에스윈드 도면관리 & MTO (Make To Order) 자동화 시스템으로, Excel BOM 파일과 PDF 도면 파일을 자동으로 매칭하여 효율적인 도면 관리를 제공합니다.

## 🌐 접속 URL
- **개발 서버**: https://3000-i6ovkx4qstgf5tedcqtx9-a402f90a.sandbox.novita.ai

## ✅ 현재 완료된 기능 (Save Point 86 기준)

### 1. BOM 데이터 처리 시스템 ✅
- **Excel 헤더 분석 기반 컬럼 매핑**: 실제 Excel 구조를 분석하여 올바른 컬럼에서 데이터 추출
- **정확한 컬럼 매핑**: 
  - Depth → A열 (0번 컬럼)
  - Name → Excel에서 "Name" 헤더를 찾아서 매핑
  - Number → F열 (5번 컬럼) - 실제 도면번호 (GST03315-001, E0005030033 등)
  - Version → J열 (9번 컬럼) 
  - FindNumber → Excel에서 "FindNumber" 또는 유사 헤더를 찾아서 매핑 (depth 0에서는 빈값)
  - Quantity, Unit, Weight, Material → 각각 올바른 컬럼에서 추출

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
index.html              # 메인 CSWIND MTO 시스템
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

### 최신 수정 (2025-10-27)

#### 1. BOM 트리 토글 기능 수정
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

**개발 완료**: 2025-10-15
**버전**: Save Point 86 복원 완료
**상태**: 운영 준비 완료 ✅