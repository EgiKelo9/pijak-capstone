import httpx
import logging
from collections import defaultdict
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.schemas.chatbot import ChatbotFrontendRequest, ChatbotFrontendResponse
from app.schemas.base import StandardResponse
from app.models.analysis_history import AnalysisHistory
from app.models.forecasting_result import ForecastingResult
from app.models.clustering_result import ClusteringResult
from app.models.ml_model import MLModel
from app.models.chat_message import ChatMessage

logger = logging.getLogger("uvicorn.error")
settings = get_settings()

async def handle_chatbot_request(
    target_task: str,
    request: ChatbotFrontendRequest,
    user_id: int,
    db: Session
) -> StandardResponse[ChatbotFrontendResponse]:
    if target_task not in ["forecasting", "clustering"]:
        raise HTTPException(status_code=400, detail="Target task must be 'forecasting' or 'clustering'")

    # database-lookup for context
    context_summary = None
    if request.task_id and request.task_id != "unknown":
        model_type = "forecasting" if target_task == "forecasting" else "clustering"
        analysis = None
        
        # 1. Try querying as analysis_id first
        if request.task_id.isdigit():
            analysis_id = int(request.task_id)
            analysis = db.query(AnalysisHistory).filter(
                AnalysisHistory.id == analysis_id,
                AnalysisHistory.user_id == user_id,
                AnalysisHistory.status == "berhasil",
                AnalysisHistory.deleted_at.is_(None)
            ).first()
            
        # 2. If not found, try querying as dataset_id
        if not analysis and request.task_id.isdigit():
            dataset_id = int(request.task_id)
            analysis = db.query(AnalysisHistory).join(MLModel).filter(
                AnalysisHistory.user_id == user_id,
                AnalysisHistory.dataset_id == dataset_id,
                AnalysisHistory.status == "berhasil",
                MLModel.type == model_type,
                AnalysisHistory.deleted_at.is_(None)
            ).order_by(AnalysisHistory.created_at.desc()).first()

        # 3. Format the result summary
        if analysis:
            if target_task == "forecasting":
                result = db.query(ForecastingResult).filter(
                    ForecastingResult.analysis_id == analysis.id
                ).first()
                if result:
                    summary_lines = [
                        "### Ringkasan Hasil Analisis Forecasting Penjualan",
                        f"- **ID Analisis**: {analysis.id}",
                        f"- **Waktu Analisis**: {analysis.created_at.strftime('%Y-%m-%d %H:%M:%S') if analysis.created_at else '-'}",
                    ]
                    if result.metrics:
                        summary_lines.append("\n**Metrik Evaluasi Model:**")
                        for freq, m in result.metrics.items():
                            if isinstance(m, dict):
                                mae = m.get('mae', 0)
                                mape = m.get('mape', 0)
                                rmse = m.get('rmse', 0)
                                r2 = m.get('r2', 0)
                                confidence = m.get('confidence_percentage', 0)
                                summary_lines.append(f"- **Frekuensi {freq.capitalize()}**: MAE={mae:.4f}, MAPE={mape:.4f}, RMSE={rmse:.4f}, R2={r2:.4f}, Confidence={confidence:.2f}%")
                    
                    if result.feature_importances:
                        summary_lines.append("\n**Faktor yang Memengaruhi Penjualan (Feature Importance) - Top 5:**")
                        for freq, features in result.feature_importances.items():
                            if isinstance(features, list) and len(features) > 0:
                                sorted_features = sorted(features, key=lambda x: x.get('influence', 0), reverse=True)[:5]
                                feat_str = ", ".join([f"{f.get('name') or 'col'} ({f.get('influence', 0):.2%})" for f in sorted_features])
                                summary_lines.append(f"- **{freq.capitalize()}**: {feat_str}")
                                
                    if result.insight_summary:
                        summary_lines.append(f"\n**Kesimpulan & Insight Bisnis (Laporan LLM):**\n{result.insight_summary}")
                    
                    # Insert the last 10% of trend_data so the LLM can read the actual values and trends
                    if result.trend_data and isinstance(result.trend_data, dict):
                        summary_lines.append("\n**Sampel Data Penjualan & Prediksi Terkini (10% Terakhir):**")
                        for freq, points in result.trend_data.items():
                            if isinstance(points, list) and len(points) > 0:
                                slice_size = max(5, int(len(points) * 0.10))
                                last_points = points[-slice_size:]
                                summary_lines.append(f"- **Frekuensi {freq.capitalize()}** (menampilkan {len(last_points)} titik terakhir):")
                                for p in last_points:
                                    date_str = p.get("date", "-")
                                    act = p.get("actual_value")
                                    pred = p.get("predicted_value")
                                    
                                    act_str = f"{act:.2f}" if act is not None else "-"
                                    pred_str = f"{pred:.2f}" if pred is not None else "-"
                                    
                                    summary_lines.append(f"  * Tanggal: {date_str} | Aktual: {act_str} | Prediksi: {pred_str}")
                    
                    context_summary = "\n".join(summary_lines)

            elif target_task == "clustering":
                result = db.query(ClusteringResult).filter(
                    ClusteringResult.analysis_id == analysis.id
                ).first()
                if result:
                    summary_lines = [
                        "### Ringkasan Hasil Analisis Segmentasi Pelanggan/Produk (Clustering)",
                        f"- **ID Analisis**: {analysis.id}",
                        f"- **Waktu Analisis**: {analysis.created_at.strftime('%Y-%m-%d %H:%M:%S') if analysis.created_at else '-'}",
                        f"- **Jumlah Cluster**: {result.cluster_amount}",
                        f"- **Optimal K**: {result.optimal_k or result.cluster_amount}",
                        f"- **Silhouette Score**: {f'{result.silhouette_score:.4f}' if result.silhouette_score is not None else '-'}",
                    ]
                    
                    if result.cluster_data and isinstance(result.cluster_data, list):
                        cluster_distribution = defaultdict(list)
                        for item in result.cluster_data:
                            prod_name = item.get('product') or item.get('product_name') or item.get('item') or str(item.get('id', ''))
                            cluster_id = item.get('cluster')
                            if cluster_id is not None:
                                cluster_distribution[cluster_id].append(prod_name)
                        
                        summary_lines.append("\n**Distribusi Cluster & Contoh Produk:**")
                        for c_id, products in sorted(cluster_distribution.items()):
                            total_products = len(products)
                            examples = ", ".join(products[:5])
                            summary_lines.append(f"- **Cluster {c_id}** ({total_products} produk): Contoh: {examples}{'...' if total_products > 5 else ''}")
                            
                    if result.insight_summary:
                        summary_lines.append(f"\n**Kesimpulan & Segmentasi Detail (Laporan LLM):**\n{result.insight_summary}")
                        
                    context_summary = "\n".join(summary_lines)

    attachment_to_send = context_summary if context_summary else request.attachment

    try:
        async with httpx.AsyncClient() as client:
            # Call ml_services chatbot endpoint
            response = await client.post(
                url=f"{settings.ML_SERVICE_URL}/ml/v1/openrouter/chatbot",
                json={
                    "task_id": request.task_id,
                    "target": target_task,
                    "message": request.message,
                    "attachment": attachment_to_send
                },
                timeout=180.0  # OpenRouter might take a moment to respond
            )
            
            if response.status_code != 200:
                detail = "Gagal menghubungi ML service"
                try:
                    detail = response.json().get("message", detail)
                except Exception:
                    pass
                raise HTTPException(status_code=502, detail=detail)

            res_json = response.json()
            ai_message = res_json.get("message", "")

            # Save chat history to database if analysis is found
            if analysis:
                try:
                    user_msg = ChatMessage(
                        analysis_id=analysis.id,
                        sender_type="user",
                        message=request.message
                    )
                    ai_msg = ChatMessage(
                        analysis_id=analysis.id,
                        sender_type="ai",
                        message=ai_message
                    )
                    db.add(user_msg)
                    db.add(ai_msg)
                    db.commit()
                except Exception as db_err:
                    db.rollback()
                    logger.warning(f"Gagal menyimpan histori chat ke DB: {db_err}")

            return StandardResponse(
                code=200,
                error=False,
                message="Berhasil memproses pertanyaan chatbot",
                data=ChatbotFrontendResponse(
                    message=ai_message,
                    metadata=res_json.get("metadata")
                )
            )
    except httpx.HTTPError as he:
        raise HTTPException(status_code=502, detail=f"HTTP Error dari ML Service: {str(he)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


async def get_chatbot_history(analysis_id: int, user_id: int, db: Session) -> StandardResponse:
    # Verify the analysis belongs to the user
    analysis = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == analysis_id,
        AnalysisHistory.user_id == user_id,
        AnalysisHistory.deleted_at.is_(None)
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis tidak ditemukan")

    # Fetch messages
    messages = db.query(ChatMessage).filter(
        ChatMessage.analysis_id == analysis_id,
        ChatMessage.deleted_at.is_(None)
    ).order_by(ChatMessage.created_at.asc()).all()

    data = []
    for msg in messages:
        # Map DB 'ai' sender_type to frontend 'assistant' role
        role = "assistant" if msg.sender_type == "ai" else "user"
        data.append({
            "message": msg.message,
            "role": role,
            "created_at": msg.created_at.isoformat()
        })

    return StandardResponse(
        code=200,
        error=False,
        message="Berhasil mengambil histori chat",
        data=data
    )
