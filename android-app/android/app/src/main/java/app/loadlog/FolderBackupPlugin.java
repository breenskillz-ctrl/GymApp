package app.loadlog;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import androidx.documentfile.provider.DocumentFile;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Automatic backups to a folder the user picks once with Android's folder picker (DECISIONS #52).
 * The folder can be on the phone or in a cloud provider such as Google Drive. The app keeps permission to it across restarts.
 */
@CapacitorPlugin(name = "FolderBackup")
public class FolderBackupPlugin extends Plugin {

    private static final String PREFS = "folder_backup";
    private static final String KEY_URI = "tree_uri";
    private static final int RW = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
    private final ExecutorService io = Executors.newSingleThreadExecutor();

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private Uri savedUri() {
        String s = prefs().getString(KEY_URI, null);
        return s == null ? null : Uri.parse(s);
    }

    private JSObject info(Uri uri) {
        JSObject o = new JSObject();
        DocumentFile dir = uri == null ? null : DocumentFile.fromTreeUri(getContext(), uri);
        o.put("name", dir != null ? dir.getName() : null);
        o.put("ok", dir != null && dir.canWrite());
        return o;
    }

    @PluginMethod
    public void pickFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(RW | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "folderPicked");
    }

    @ActivityCallback
    private void folderPicked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.reject("No folder chosen", "CANCELLED");
            return;
        }
        Uri uri = data.getData();
        ContentResolver resolver = getContext().getContentResolver();
        resolver.takePersistableUriPermission(uri, RW);
        Uri old = savedUri();
        if (old != null && !old.equals(uri)) {
            try {
                resolver.releasePersistableUriPermission(old, RW);
            } catch (Exception ignored) {
                // the old folder may already be gone
            }
        }
        prefs().edit().putString(KEY_URI, uri.toString()).apply();
        call.resolve(info(uri));
    }

    @PluginMethod
    public void getFolder(PluginCall call) {
        call.resolve(info(savedUri()));
    }

    @PluginMethod
    public void clearFolder(PluginCall call) {
        Uri old = savedUri();
        if (old != null) {
            try {
                getContext().getContentResolver().releasePersistableUriPermission(old, RW);
            } catch (Exception ignored) {
                // nothing to release
            }
        }
        prefs().edit().remove(KEY_URI).apply();
        call.resolve();
    }

    /** Writes (or overwrites) one file in the folder, then keeps only the newest `keep` files that start with `prefix`. */
    @PluginMethod
    public void writeFile(PluginCall call) {
        String name = call.getString("name");
        String text = call.getString("data");
        String prefix = call.getString("prefix", "");
        int keep = call.getInt("keep", 14);
        Uri uri = savedUri();
        if (uri == null) {
            call.reject("No backup folder chosen", "NO_FOLDER");
            return;
        }
        if (name == null || text == null) {
            call.reject("Missing name or data");
            return;
        }
        io.execute(() -> {
            try {
                DocumentFile dir = DocumentFile.fromTreeUri(getContext(), uri);
                if (dir == null || !dir.canWrite()) {
                    call.reject("The backup folder can no longer be reached", "NO_ACCESS");
                    return;
                }
                DocumentFile file = dir.findFile(name);
                if (file == null) file = dir.createFile("application/json", name);
                if (file == null) {
                    call.reject("Could not create the backup file", "WRITE_FAILED");
                    return;
                }
                try (OutputStream out = getContext().getContentResolver().openOutputStream(file.getUri(), "wt")) {
                    if (out == null) throw new IllegalStateException("No output stream");
                    out.write(text.getBytes(StandardCharsets.UTF_8));
                }
                // Prune old automatic backups (names contain the date, so name order is date order)
                List<DocumentFile> ours = new ArrayList<>();
                for (DocumentFile f : dir.listFiles()) {
                    String n = f.getName();
                    if (n != null && !prefix.isEmpty() && n.startsWith(prefix)) ours.add(f);
                }
                ours.sort((a, b) -> b.getName().compareTo(a.getName()));
                for (int i = keep; i < ours.size(); i++) ours.get(i).delete();
                JSObject res = new JSObject();
                res.put("name", file.getName());
                call.resolve(res);
            } catch (Exception e) {
                call.reject("Backup failed: " + e.getMessage(), "WRITE_FAILED", e);
            }
        });
    }
}
