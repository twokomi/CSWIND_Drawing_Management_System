// 🔥 새로운 BOM 처리 함수 - 기준정보 컬럼만 추출하는 방식
function processBOMDataSales(rawData, worksheet = null, cellStyleInfo = null) {
    console.log('🚀 새로운 BOM 데이터 처리 시작 - 기준정보 컬럼만 추출');
    
    if (!rawData || rawData.length < 2) {
        console.error('❌ BOM 데이터가 충분하지 않습니다');
        return;
    }
    
    // 🎯 1단계: 전체 Excel 데이터 구조 분석
    console.log('📋 원본 Excel 전체 데이터 구조 분석:');
    console.log('헤더 행:', rawData[0]);
    console.log('총 컬럼 수:', rawData[0] ? rawData[0].length : 0);
    console.log('총 행 수:', rawData.length);
    
    // 🎯 2단계: 사용자가 원하는 기준정보 컬럼만 선별 추출
    console.log('🎯 기준정보 컬럼 추출 시작');
    
    // 원본 데이터에서 기준정보만 추출한 새로운 데이터 생성
    const filteredData = [];
    
    // 새로운 헤더 (기준정보만)
    const newHeaders = ['Depth', 'Name', 'Number', 'Version', 'FindNumber', 'Quantity', 'Unit', 'Weight', 'Material'];
    filteredData.push(newHeaders);
    
    // 🔍 각 행에서 기준정보 컬럼만 추출
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;
        
        console.log(`\n🔍 원본 행 ${i}:`, row);
        
        // 🎯 사용자가 지정한 컬럼 위치에서 데이터 추출
        // 사용자 Excel 구조에 맞춰 직접 인덱스 지정
        const extractedRow = [
            row[0] || '',   // A열: Depth
            row[1] || '',   // B열: Name (실제 부품명 - BOM Cube에서 추출하지 않고 단순 부품명)
            row[2] || '',   // C열: Number (실제 도면번호)
            row[3] || '',   // D열: Version  
            row[4] || '',   // E열: FindNumber (포지션 번호)
            row[5] || '',   // F열: Quantity
            row[6] || '',   // G열: Unit
            row[7] || '',   // H열: Weight
            row[8] || ''    // I열: Material
        ];
        
        console.log(`✅ 추출된 행 ${i}:`, extractedRow);
        filteredData.push(extractedRow);
    }
    
    // 🎯 3단계: 추출된 기준정보로 BOM 데이터 생성
    console.log('📊 추출된 기준정보로 BOM 객체 생성');
    
    salesBOMData = [];
    
    for (let i = 1; i < filteredData.length; i++) {
        const row = filteredData[i];
        
        const item = {
            id: `sales-bom-${i}`,
            depth: parseInt(row[0]) || 0,
            name: row[1] || '',
            number: row[2] || '',
            version: row[3] || '',
            findNumber: row[4] || '',
            quantity: row[5] || '',
            unit: row[6] || '',
            weight: row[7] || '',
            material: row[8] || '',
            children: [],
            isVisible: parseInt(row[0]) === 0, // Depth 0만 초기 표시
            hasDrawing: false,
            drawingFile: null
        };
        
        console.log(`📦 생성된 BOM 아이템 ${i}:`, item);
        salesBOMData.push(item);
    }
    
    console.log('✅ 처리된 Sales BOM 데이터:', salesBOMData.length, '개 아이템');
    
    // 🎯 4단계: 계층구조 생성
    buildBOMHierarchySales();
    
    // 🎯 5단계: BOM 테이블 표시
    displayBOMTableSales();
    
    // 🎯 6단계: 통계 업데이트
    updateBOMStatsSales();
}