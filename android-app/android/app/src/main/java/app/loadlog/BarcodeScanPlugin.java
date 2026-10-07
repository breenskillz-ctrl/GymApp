package app.loadlog;

import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.journeyapps.barcodescanner.ScanContract;
import com.journeyapps.barcodescanner.ScanIntentResult;
import com.journeyapps.barcodescanner.ScanOptions;

/**
 * Native barcode scanner for the Food tab (DECISIONS #58): the same zxing-android-embedded scanner Makrologg used.
 * scan() opens the camera full screen and resolves { code } with the digits, or { code: null } when the user backs out.
 */
@CapacitorPlugin(name = "BarcodeScan")
public class BarcodeScanPlugin extends Plugin {

    @PluginMethod
    public void scan(PluginCall call) {
        ScanOptions options = new ScanOptions()
            .setDesiredBarcodeFormats(ScanOptions.EAN_13, ScanOptions.EAN_8, ScanOptions.UPC_A, ScanOptions.UPC_E, ScanOptions.CODE_128)
            .setPrompt("Hold the barcode inside the frame")
            .setBeepEnabled(true)
            .setOrientationLocked(true);
        Intent intent = new ScanContract().createIntent(getContext(), options);
        startActivityForResult(call, intent, "scanned");
    }

    @ActivityCallback
    private void scanned(PluginCall call, ActivityResult result) {
        if (call == null) return;
        ScanIntentResult r = ScanIntentResult.parseActivityResult(result.getResultCode(), result.getData());
        JSObject res = new JSObject();
        res.put("code", r.getContents());
        call.resolve(res);
    }
}
