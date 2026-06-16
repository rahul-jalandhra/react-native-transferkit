#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

extern NSString * const TransferkitStreamDataNotification;
extern NSString * const TransferkitStreamCompleteNotification;
extern NSString * const TransferkitStreamErrorNotification;
extern NSString * const TransferkitStreamCancelNotification;

extern NSString * const TransferkitUploadProgressNotification;
extern NSString * const TransferkitUploadCompleteNotification;
extern NSString * const TransferkitUploadErrorNotification;
extern NSString * const TransferkitUploadCancelNotification;

@interface TransferkitEventEmitter : RCTEventEmitter

@end