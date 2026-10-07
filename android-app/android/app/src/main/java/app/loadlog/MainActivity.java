package app.loadlog;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BarcodeScanPlugin.class); // camera barcode scanner for the Food tab (DECISIONS #58)
        registerPlugin(FolderBackupPlugin.class); // automatic backups to a folder the user picks (DECISIONS #52)
        super.onCreate(savedInstanceState);
    }
}
