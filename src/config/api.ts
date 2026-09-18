// EC2開発サーバーのバックエンドURL。インスタンス再作成時はIPが変わるため要更新
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://35.72.165.240:4000';
