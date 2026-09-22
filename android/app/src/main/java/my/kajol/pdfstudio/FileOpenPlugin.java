package my.kajol.pdfstudio;

import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@CapacitorPlugin(name = "FileOpen")
public class FileOpenPlugin extends Plugin {

    private static FileOpenPlugin instance = null;
    private static boolean jsReady = false;
    private static String pendingName = null;
    private static String pendingData = null;
    private static String pendingMime = null;

    @Override
    public void load() {
        instance = this;
        Log.d("FileOpen", "Plugin loaded");
    }

    @PluginMethod
    public void getPendingFile(PluginCall call) {
        Log.d("FileOpen", "getPendingFile called");
        JSObject ret = new JSObject();
        if (pendingData == null) {
            ret.put("hasFile", false);
        } else {
            ret.put("hasFile", true);
            ret.put("name", pendingName);
            ret.put("data", pendingData);
            ret.put("mime", pendingMime);
            clearPending();
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void notifyReady(PluginCall call) {
        Log.d("FileOpen", "notifyReady called");
        jsReady = true;
        pushPendingIfReady();
        call.resolve();
    }

    private static void clearPending() {
        pendingData = null;
        pendingName = null;
        pendingMime = null;
    }

    private static void pushPendingIfReady() {
        if (instance == null || !jsReady || pendingData == null) return;
        try {
            JSObject ret = new JSObject();
            ret.put("hasFile", true);
            ret.put("name", pendingName);
            ret.put("data", pendingData);
            ret.put("mime", pendingMime);
            final JSObject finalRet = ret;
            Log.d("FileOpen", "Pushing to JS: " + pendingName);
            instance.getActivity().runOnUiThread(() -> {
                instance.notifyListeners("fileReceived", finalRet, true);
            });
            clearPending();
        } catch (Exception e) {
            Log.e("FileOpen", "push error", e);
        }
    }

    public static void processIntent(Intent intent, Context ctx) {
        Log.d("FileOpen", "processIntent");
        if (intent == null) return;
        Uri uri = intent.getData();
        if (uri == null) {
            Log.d("FileOpen", "uri null");
            return;
        }
        try {
            String mime = intent.getType();
            String name = getFileName(uri, ctx);
            Log.d("FileOpen", "File: " + name + " mime=" + mime);

            InputStream is = ctx.getContentResolver().openInputStream(uri);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = is.read(buf)) > 0) bos.write(buf, 0, n);
            is.close();
            byte[] bytes = bos.toByteArray();
            pendingData = Base64.encodeToString(bytes, Base64.NO_WRAP);
            pendingName = name;
            pendingMime = mime;

            Log.d("FileOpen", "pending set size=" + bytes.length);
            pushPendingIfReady();
        } catch (Exception e) {
            Log.e("FileOpen", "Error processIntent", e);
        }
    }

    private static String getFileName(Uri uri, Context ctx) {
        String result = "file";
        try {
            Cursor cursor = ctx.getContentResolver().query(uri, null, null, null, null);
            if (cursor != null) {
                int idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (idx >= 0 && cursor.moveToFirst()) {
                    result = cursor.getString(idx);
                }
                cursor.close();
            }
        } catch (Exception ignored) {}
        return result;
    }
}
