#import "TransferkitEventEmitter.h"

NSString * const TransferkitStreamDataNotification = @"TransferkitStreamDataNotification";
NSString * const TransferkitStreamCompleteNotification = @"TransferkitStreamCompleteNotification";
NSString * const TransferkitStreamErrorNotification = @"TransferkitStreamErrorNotification";
NSString * const TransferkitStreamCancelNotification = @"TransferkitStreamCancelNotification";

NSString * const TransferkitUploadProgressNotification = @"TransferkitUploadProgressNotification";
NSString * const TransferkitUploadCompleteNotification = @"TransferkitUploadCompleteNotification";
NSString * const TransferkitUploadErrorNotification = @"TransferkitUploadErrorNotification";
NSString * const TransferkitUploadCancelNotification = @"TransferkitUploadCancelNotification";

@implementation TransferkitEventEmitter

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
    return @[
        @"onStreamData",
        @"onStreamComplete",
        @"onStreamError",
        @"onStreamCancel",
        @"onUploadProgress",
        @"onUploadComplete",
        @"onUploadError",
        @"onUploadCancel"
    ];
}

- (void)startObserving
{
    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];

    [center addObserver:self selector:@selector(handleStreamData:) name:TransferkitStreamDataNotification object:nil];
    [center addObserver:self selector:@selector(handleStreamComplete:) name:TransferkitStreamCompleteNotification object:nil];
    [center addObserver:self selector:@selector(handleStreamError:) name:TransferkitStreamErrorNotification object:nil];
    [center addObserver:self selector:@selector(handleStreamCancel:) name:TransferkitStreamCancelNotification object:nil];
    [center addObserver:self selector:@selector(handleUploadProgress:) name:TransferkitUploadProgressNotification object:nil];
    [center addObserver:self selector:@selector(handleUploadComplete:) name:TransferkitUploadCompleteNotification object:nil];
    [center addObserver:self selector:@selector(handleUploadError:) name:TransferkitUploadErrorNotification object:nil];
    [center addObserver:self selector:@selector(handleUploadCancel:) name:TransferkitUploadCancelNotification object:nil];
}

- (void)stopObserving
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)handleStreamData:(NSNotification *)notification
{
    [self sendEventWithName:@"onStreamData" body:notification.userInfo];
}

- (void)handleStreamComplete:(NSNotification *)notification
{
    [self sendEventWithName:@"onStreamComplete" body:notification.userInfo];
}

- (void)handleStreamError:(NSNotification *)notification
{
    [self sendEventWithName:@"onStreamError" body:notification.userInfo];
}

- (void)handleStreamCancel:(NSNotification *)notification
{
    [self sendEventWithName:@"onStreamCancel" body:notification.userInfo];
}

- (void)handleUploadProgress:(NSNotification *)notification
{
    [self sendEventWithName:@"onUploadProgress" body:notification.userInfo];
}

- (void)handleUploadComplete:(NSNotification *)notification
{
    [self sendEventWithName:@"onUploadComplete" body:notification.userInfo];
}

- (void)handleUploadError:(NSNotification *)notification
{
    [self sendEventWithName:@"onUploadError" body:notification.userInfo];
}

- (void)handleUploadCancel:(NSNotification *)notification
{
    [self sendEventWithName:@"onUploadCancel" body:notification.userInfo];
}

@end