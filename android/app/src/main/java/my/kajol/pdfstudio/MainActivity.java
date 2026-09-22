package my.kajol.pdfstudio;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FileOpenPlugin.class);
        super.onCreate(savedInstanceState);
        FileOpenPlugin.processIntent(getIntent(), this);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        FileOpenPlugin.processIntent(intent, this);
    }
}
