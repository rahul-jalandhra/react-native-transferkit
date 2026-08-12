#import <React/RCTBridgeModule.h>

#if __has_include(<TransferkitSpec/TransferkitSpec.h>)
#import <TransferkitSpec/TransferkitSpec.h>
@interface Transferkit : NSObject <NativeTransferkitSpec>
#else
@interface Transferkit : NSObject <RCTBridgeModule>
#endif

@end
