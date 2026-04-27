import json
import time
import azure.cognitiveservices.speech as speechsdk
from pathlib import Path

# ============================================================
# 設定區（只需改這裡）
# ============================================================
SPEECH_KEY = "CKFHXYY8IJZuKKvxgN0PZpxNlj9JD5vDNvaMfqZw8ynwmLYDtjNVJQQJ99CDACL93NaXJ3w3AAAYACOGxT1M"       # 替換為 Azure KEY 1
SPEECH_REGION = "australiaeast"
MANIFEST_FILE = "tts_manifest.json"
OUTPUT_DIR = Path("audio/tts")
ERROR_LOG = "tts_errors.log"
# ============================================================

def synthesize(entry, speech_key, region):
    filename = entry["filename"]
    text = entry["text"]
    voice = entry["voice"]

    speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=region)
    speech_config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
    )

    mp3_path = OUTPUT_DIR / filename
    audio_config = speechsdk.audio.AudioOutputConfig(filename=str(mp3_path))
    synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config,
        audio_config=audio_config
    )

    # 收集 word-level timestamps
    word_boundaries = []
    def word_boundary_handler(evt):
        word_boundaries.append({
            "word": evt.text,
            "start_ms": evt.audio_offset / 10000,
            "duration_ms": evt.duration.total_seconds() * 1000
        })
    synthesizer.synthesis_word_boundary.connect(word_boundary_handler)

    result = synthesizer.speak_ssml_async(text).get()

    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        # 寫入 timestamps JSON
        json_path = OUTPUT_DIR / filename.replace(".mp3", ".json")
        timestamps = {
            "filename": filename,
            "speaker": entry.get("speaker", ""),
            "words": word_boundaries
        }
        json_path.write_text(
            json.dumps(timestamps, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
        return True
    else:
        if result.reason == speechsdk.ResultReason.Canceled:
            detail = speechsdk.SpeechSynthesisCancellationDetails(result)
            raise Exception(f"{detail.reason}: {detail.error_details}")
        raise Exception(f"未知錯誤：{result.reason}")

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    total = len(manifest)
    done = 0
    skipped = 0
    failed = 0

    open(ERROR_LOG, "w").close()

    print(f"開始生成 TTS，共 {total} 條")

    for i, entry in enumerate(manifest):
        filename = entry["filename"]
        mp3_path = OUTPUT_DIR / filename

        # 已存在則跳過
        if mp3_path.exists():
            skipped += 1
            continue

        try:
            synthesize(entry, SPEECH_KEY, SPEECH_REGION)
            done += 1
        except Exception as e:
            failed += 1
            with open(ERROR_LOG, "a", encoding="utf-8") as log:
                log.write(f"失敗：{filename} | {str(e)}\n")

        if (i + 1) % 10 == 0:
            print(f"[進度] {i+1}/{total} | 完成：{done} | 跳過：{skipped} | 失敗：{failed}")

        time.sleep(0.1)

    print(f"\n完成！總計：{total} | 完成：{done} | 跳過：{skipped} | 失敗：{failed}")
    if failed > 0:
        print(f"失敗記錄見 {ERROR_LOG}")

if __name__ == "__main__":
    main()
