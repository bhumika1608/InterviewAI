import os
import tempfile
import threading

from apps.ai.services import AIServiceError

_model = None
_model_lock = threading.Lock()
_pyav_compat_installed = False


def _install_pyav_compatibility():
    global _pyav_compat_installed
    if _pyav_compat_installed:
        return

    import av

    original_open = av.open

    def compatible_open(*args, **kwargs):
        try:
            return original_open(*args, **kwargs)
        except TypeError as error:
            if 'metadata_errors' not in kwargs or 'metadata_errors' not in str(error):
                raise
            kwargs.pop('metadata_errors')
            return original_open(*args, **kwargs)

    av.open = compatible_open
    _pyav_compat_installed = True


def transcribe_audio(audio_file):
    global _model

    suffix = os.path.splitext(audio_file.name)[1] or '.webm'
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temporary_file:
            temporary_path = temporary_file.name
            for chunk in audio_file.chunks():
                temporary_file.write(chunk)

        with _model_lock:
            if _model is None:
                from faster_whisper import WhisperModel

                _install_pyav_compatibility()
                _model = WhisperModel('base.en', device='cpu', compute_type='int8')
            model = _model

        segments, _ = model.transcribe(
            temporary_path,
            language='en',
            beam_size=3,
            vad_filter=True,
        )
        transcript = ' '.join(segment.text.strip() for segment in segments if segment.text.strip())
        if not transcript:
            raise AIServiceError('No speech was detected. Please try speaking again or type your answer.')
        return transcript
    except AIServiceError:
        raise
    except Exception as error:
        raise AIServiceError('Local voice transcription failed. Please retry or type your answer.') from error
    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.unlink(temporary_path)