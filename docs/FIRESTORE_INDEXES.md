# Firestore 인덱스 배포 가이드

## 문제 상황

Firestore 쿼리 최적화를 위해 `order_by`를 사용하는 경우, 복합 인덱스가 필요합니다. 인덱스가 없으면 다음과 같은 오류가 발생합니다:

```
400 The query requires an index.
```

## 해결 방법

### 방법 1: Firebase Console에서 수동 생성 (권장)

1. Firebase Console에 접속: https://console.firebase.google.com
2. 프로젝트 선택: `thinkblock`
3. Firestore Database로 이동
4. "Indexes" 탭 클릭
5. 오류 메시지에 포함된 URL을 클릭하거나, 수동으로 인덱스 생성:
   - Collection ID: `blocks`
   - Fields:
     - `level` (Ascending)
     - `order` (Ascending)
6. "Create Index" 클릭
7. 인덱스 생성 완료까지 몇 분 소요 (상태: "Building" → "Enabled")

### 방법 2: gcloud CLI로 배포

```bash
# 프로젝트 설정
gcloud config set project thinkblock

# 인덱스 배포
gcloud firestore indexes create --project=thinkblock
```

또는 `firestore.indexes.json` 파일이 있는 경우:

```bash
# 인덱스 파일 배포
gcloud firestore indexes create --project=thinkblock --file=firestore.indexes.json
```

### 방법 3: Firebase CLI 사용

```bash
# Firebase CLI 설치 (없는 경우)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화 (이미 초기화된 경우 생략)
firebase init firestore

# 인덱스 배포
firebase deploy --only firestore:indexes
```

## 현재 정의된 인덱스

`firestore.indexes.json` 파일에 다음 인덱스가 정의되어 있습니다:

```json
{
  "indexes": [
    {
      "collectionGroup": "blocks",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "level",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "order",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
```

## Fallback 동작

인덱스가 아직 생성되지 않은 경우, 코드는 자동으로 fallback 모드를 사용합니다:

1. 서버 측 정렬 시도
2. 인덱스 오류 발생 시
3. 모든 문서를 가져온 후 메모리에서 정렬

이 방식은 인덱스가 없어도 작동하지만, 성능이 떨어질 수 있습니다.

## 인덱스 생성 확인

인덱스가 생성되었는지 확인:

```bash
# gcloud CLI 사용
gcloud firestore indexes list --project=thinkblock

# 또는 Firebase Console에서 확인
# Firestore Database → Indexes 탭
```

## 참고 사항

- 인덱스 생성은 몇 분에서 몇 시간까지 걸릴 수 있습니다 (데이터 양에 따라)
- 인덱스가 생성되는 동안에도 애플리케이션은 정상 작동합니다 (fallback 모드 사용)
- 프로덕션 환경에서는 반드시 인덱스를 생성하는 것을 권장합니다

